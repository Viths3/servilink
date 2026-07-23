const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    cliente:          {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El cliente es requerido'],
    },
    proveedor:        {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El proveedor es requerido'],
    },
    anuncio:          {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      default: null,
    },
    descripcion:      { type: String, required: [true, 'La descripción es requerida'], trim: true },
    fechaPropuesta:   { type: Date, required: [true, 'La fecha propuesta es requerida'] },
    fechaConfirmada:  { type: Date, default: null },
    estado:           {
      type: String,
      enum: ['pendiente', 'aceptada', 'rechazada', 'reagendada', 'completada', 'cancelada'],
      default: 'pendiente',
    },
    motivoRechazo:    { type: String, default: '' },
    // Fotos que el proveedor adjunta al marcar el servicio como completado —
    // sirven como evidencia si el cliente disputa el pago más adelante.
    evidenciaCompletado: [{ type: String }],
    // Banderas para no reenviar el mismo recordatorio de WhatsApp más de una vez
    // (ver src/services/reminderService.js).
    recordatorioVisitaEnviado:    { type: Boolean, default: false },
    recordatorioPendienteEnviado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ cliente: 1, createdAt: -1 });
serviceRequestSchema.index({ proveedor: 1, createdAt: -1 });
serviceRequestSchema.index({ estado: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
