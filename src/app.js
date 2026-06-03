const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos como estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── RUTAS ─────────────────────────────────────────────────────────
// Sprint 1: Auth
app.use('/api/auth', require('./routes/auth.routes'));

// Sprint 2: Usuarios, Verificación, Upgrade de rol
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/upgrade-requests', require('./routes/upgrade.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Sprint 3: Anuncios, Solicitudes
// app.use('/api/announcements',    require('./routes/announcement.routes'));
// app.use('/api/service-requests', require('./routes/serviceRequest.routes'));

// ── RUTA BASE ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ mensaje: 'ServiLink API v1.0', estado: 'activo' });
});

// ── MANEJO DE RUTAS NO ENCONTRADAS ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── MANEJO GLOBAL DE ERRORES ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
