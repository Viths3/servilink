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
  },
  { timestamps: true }
);

serviceRequestSchema.index({ cliente: 1, createdAt: -1 });
serviceRequestSchema.index({ proveedor: 1, createdAt: -1 });
serviceRequestSchema.index({ estado: 1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
