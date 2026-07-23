const mongoose = require('mongoose');

// Respuesta del proveedor a la disputa — su oportunidad de presentar su
// versión y evidencia antes de que un admin decida (como en el Resolution
// Center de Airbnb: la otra parte responde antes de escalar a soporte).
const respuestaProveedorSchema = new mongoose.Schema(
  {
    texto:     { type: String, required: true, trim: true },
    evidencia: [{ type: String }],
    fecha:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputaSchema = new mongoose.Schema(
  {
    motivo:            { type: String, required: true, trim: true },
    fecha:             { type: Date, default: Date.now },
    resuelta:          { type: Boolean, default: false },
    resolucion:        { type: String, enum: ['', 'liberar', 'reembolsar'], default: '' },
    respuestaProveedor: { type: respuestaProveedorSchema, default: null },
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
    // Evita reenviar el recordatorio de "pago pendiente" más de una vez.
    recordatorioPagoEnviado: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ solicitud: 1 });
paymentSchema.index({ cliente: 1, createdAt: -1 });
paymentSchema.index({ proveedor: 1, createdAt: -1 });
paymentSchema.index({ estado: 1, fechaLiberacionProgramada: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
