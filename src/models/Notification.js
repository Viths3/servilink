const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tipo:    { type: String, required: true },
    mensaje: { type: String, required: true, trim: true },
    // Ruta interna del frontend a la que navegar al hacer clic (ej. /mensajes, /dashboard).
    link:    { type: String, default: '' },
    leida:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ usuario: 1, createdAt: -1 });
notificationSchema.index({ usuario: 1, leida: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
