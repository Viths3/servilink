const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    de:        {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    para:      {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contenido: { type: String, required: [true, 'El contenido es requerido'], trim: true, maxlength: 2000 },
    leido:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ de: 1, para: 1, createdAt: -1 });
messageSchema.index({ para: 1, leido: 1 });

module.exports = mongoose.model('Message', messageSchema);
