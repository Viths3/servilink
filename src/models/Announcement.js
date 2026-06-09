const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema(
  {
    usuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    motivo:      {
      type: String,
      required: true,
      enum: ['contenido_inapropiado', 'informacion_falsa', 'spam', 'otro'],
    },
    descripcion: { type: String, default: '' },
    fecha:       { type: Date, default: Date.now },
    revisado:    { type: Boolean, default: false },
  },
  { _id: true }
);

const announcementSchema = new mongoose.Schema(
  {
    proveedor:   {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El proveedor es requerido'],
    },
    titulo:      { type: String, required: [true, 'El título es requerido'], trim: true },
    descripcion: { type: String, required: [true, 'La descripción es requerida'], trim: true },
    categoria:   {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: ['electricidad', 'plomeria', 'medicina', 'carpinteria', 'asesoria', 'jardineria', 'limpieza', 'pintura', 'mecanica', 'diseno', 'fotografia', 'otro'],
    },
    precioRef:   { type: Number, min: 0, default: null },
    imagenes:    [{ type: String }],
    imagenUrl:   { type: String, default: null },
    estado:      {
      type: String,
      enum: ['activo', 'inactivo', 'suspendido'],
      default: 'activo',
    },
    reportes:    [reporteSchema],
  },
  { timestamps: true }
);

announcementSchema.index({ proveedor: 1 });
announcementSchema.index({ categoria: 1, estado: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
