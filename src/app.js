const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── SWAGGER UI ────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ServiLink API Docs',
}));

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

// ── MANEJO DE RUTAS NO ENCONTRADAS ───────────────────────────────
// Comentado en producción: el 404 lo maneja React Router del frontend
// y server.js sirve index.html para todas las rutas no API
// app.use((req, res) => {
//   res.status(404).json({ error: 'Ruta no encontrada' });
// });

// ── MANEJO GLOBAL DE ERRORES ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
