const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    solicitud:   {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      unique: true,
    },
    cliente:     {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    proveedor:   {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    puntuacion:  {
      type: Number,
      required: [true, 'La puntuación es requerida'],
      min: 1,
      max: 5,
    },
    comentario:  { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ proveedor: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
