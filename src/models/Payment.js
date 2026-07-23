const mongoose = require('mongoose');

const disputaSchema = new mongoose.Schema(
  {
    motivo:    { type: String, required: true, trim: true },
    fecha:     { type: Date, default: Date.now },
    resuelta:  { type: Boolean, default: false },
    resolucion: { type: String, enum: ['', 'liberar', 'reembolsar'], default: '' },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    solicitud: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
    },
    cliente:   {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    proveedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monto:              { type: Number, required: [true, 'El monto es requerido'], min: 0.01 },
    comisionPorcentaje:  { type: Number, required: true },
    comisionMonto:       { type: Number, required: true },
    montoProveedor:      { type: Number, required: true },
    metodo:              { type: String, enum: ['tarjeta'], default: 'tarjeta' },
    // pendiente:   cobro generado, cliente aún no paga
    // retenido:    cliente pagó, ServiLink retiene el dinero (servicio aún no completado)
    // liberado:    servicio completado y ventana de disputa vencida — listo para pagar al proveedor
    // pagado:      ServiLink ya transfirió el monto al proveedor
    // en_disputa:  el cliente reportó un problema — congelado hasta resolución de un admin
    // fallido:     el intento de cobro fue rechazado
    estado: {
      type: String,
      enum: ['pendiente', 'retenido', 'liberado', 'pagado', 'en_disputa', 'fallido'],
      default: 'pendiente',
    },
    transaccionExternaId:      { type: String, default: '' },
    clientTransactionId:       { type: String, default: '' },
    referenciaTransferencia:   { type: String, default: '' },
    fechaPago:                 { type: Date, default: null },
    fechaLiberacionProgramada: { type: Date, default: null },
    fechaLiberacion:           { type: Date, default: null },
    fechaPagadoProveedor:      { type: Date, default: null },
    disputa: { type: disputaSchema, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ solicitud: 1 });
paymentSchema.index({ cliente: 1, createdAt: -1 });
paymentSchema.index({ proveedor: 1, createdAt: -1 });
paymentSchema.index({ estado: 1, fechaLiberacionProgramada: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
