const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

const esProduccion = process.env.NODE_ENV === 'production';

// Railway (y cualquier hosting con proxy inverso) termina TLS en su borde y
// reenvía por HTTP interno, indicando el esquema real vía X-Forwarded-Proto.
// Sin esto, req.protocol siempre reporta 'http', lo que generaría URLs de
// retorno de PayPhone inseguras (ver paymentController.iniciarPago).
app.set('trust proxy', 1);

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────
// La CSP por defecto de helmet solo permite imágenes propias/data: — el
// frontend todavía usa algunos íconos servidos desde Flaticon, así que se
// permite explícitamente ese host en vez de desactivar la política entera.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'blob:', 'https://cdn-icons-png.flaticon.com'],
    },
  },
}));
// Restringe CORS al origen público conocido en producción; en desarrollo
// se permite cualquier origen para no trabar el flujo local con Vite.
app.use(cors({
  origin: esProduccion ? (process.env.PUBLIC_URL || true) : true,
}));
// Límite general de peticiones por IP para toda la API — mitiga scraping y
// abuso de bajo esfuerzo; los endpoints de login/registro tienen límites
// más estrictos aplicados además de este.
app.use('/api', apiLimiter);
// Límite explícito de tamaño de payload JSON/urlencoded: los archivos van
// por multipart/multer (con su propio límite de 5 MB), así que el cuerpo
// JSON normal no necesita más de 100kb.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Responder cuando el archivo ya no existe, sin dejar la solicitud abierta.
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'Archivo no encontrado' });
});

// ── SWAGGER UI ────────────────────────────────────────────────────
// Solo se expone fuera de producción: documenta toda la superficie de la
// API (incluidos endpoints de admin) y no debe ser pública en vivo.
if (!esProduccion) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ServiLink API Docs',
  }));
}

// ── RUTAS ─────────────────────────────────────────────────────────
// Sprint 1: Auth
app.use('/api/auth', require('./routes/auth.routes'));

// Sprint 2: Usuarios, Verificación, Upgrade de rol
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/upgrade-requests', require('./routes/upgrade.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Sprint 3: Anuncios, Solicitudes
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/service-requests', require('./routes/serviceRequest.routes'));

// Sprint 4: Mensajería interna, Pagos
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// ── RUTA HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'ServiLink API v1.0', estado: 'activo' });
});

// ── MANEJO DE RUTAS /api NO ENCONTRADAS ──────────────────────────
// El 404 de las rutas del frontend lo maneja React Router (server.js sirve
// index.html), pero un /api/* que no matchea ningún router debe responder
// 404 explícito en vez de quedar sin respuesta.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── MANEJO GLOBAL DE ERRORES ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: esProduccion ? 'Error interno del servidor' : (err.message || 'Error interno del servidor'),
  });
});

module.exports = app;
