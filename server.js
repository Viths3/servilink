require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const app = require('./src/app');
const { runRecordatorios } = require('./src/services/reminderService');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ── Red de seguridad a nivel de proceso ───────────────────────────
// Sin esto, una promesa rechazada que no se capturó en ningún try/catch
// (por ejemplo un bug en el flujo de pagos) puede tumbar TODO el proceso
// de Node — no solo esa petición — y con eso a clientes, mensajería,
// autenticación, etc. Esta es la razón real por la que "si pagos falla
// no debería afectar al resto": ya lo garantiza Express por petición
// mientras el error esté en un try/catch, pero esto cubre los casos que
// se escapen de esa red (promesas sueltas, callbacks de librerías, etc.).
//
// unhandledRejection: se registra pero NO se reinicia el proceso — por
// definición es un error asíncrono que no corrompe el resto del estado
// del servidor, solo esa operación puntual quedó sin resolver.
process.on('unhandledRejection', (razon) => {
  console.error('⚠️  unhandledRejection (no tumbó el servidor):', razon);
});

// uncaughtException: Node ya no garantiza que el proceso esté en un
// estado consistente después de esto, así que se registra y se apaga
// de forma ordenada — Railway (restartPolicy: ON_FAILURE) lo reinicia
// solo, en vez de quedar corriendo en un estado potencialmente corrupto.
process.on('uncaughtException', (err) => {
  console.error('🔥 uncaughtException — cerrando para que Railway reinicie el proceso:', err);
  process.exit(1);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
    }
  });
}

// Conectar a MongoDB y arrancar servidor
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
    });

    // Recordatorios por WhatsApp (visitas próximas, solicitudes y pagos
    // pendientes): se revisan cada 15 minutos. Las banderas en los modelos
    // evitan que un mismo recordatorio se envíe más de una vez.
    runRecordatorios();
    setInterval(runRecordatorios, 15 * 60 * 1000);
  })
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
