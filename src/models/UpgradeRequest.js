const mongoose = require('mongoose');

const upgradeRequestSchema = new mongoose.Schema(
  {
    usuario:     {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido'],
    },
    cedula:      { type: String, required: [true, 'La cédula es requerida'] },
    categoria:   {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: ['electricidad', 'plomeria', 'medicina', 'carpinteria', 'asesoria', 'otro'],
    },
    descripcion: { type: String, default: '' },
    documentos:  [{ type: String }],
    estado:      {
      type: String,
      enum: ['pendiente', 'aprobada', 'rechazada'],
      default: 'pendiente',
    },
    comentario:  { type: String, default: '' },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

upgradeRequestSchema.index({ usuario: 1 });
upgradeRequestSchema.index({ estado: 1 });

module.exports = mongoose.model('UpgradeRequest', upgradeRequestSchema);
