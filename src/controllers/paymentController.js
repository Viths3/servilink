const crypto          = require('crypto');
const Payment         = require('../models/Payment');
const ServiceRequest  = require('../models/ServiceRequest');
const payphoneService = require('../services/payphoneService');
const { COMISION_PORCENTAJE, HORAS_RETENCION, modoLive } = require('../config/payments');
const { notificarDisputaAbierta } = require('../services/whatsappService');
const { crearNotificacion } = require('../services/notificationService');

// ── Libera automáticamente los pagos cuya ventana de disputa venció ──
// Un pago 'retenido' pasa a 'liberado' cuando el servicio fue marcado
// completado (fechaLiberacionProgramada) y esa fecha ya pasó, siempre
// que no haya una disputa abierta.
const liberarPagosVencidos = async (filtro = {}) => {
  const criterio = {
    ...filtro,
    estado: 'retenido',
    fechaLiberacionProgramada: { $ne: null, $lte: new Date() },
  };

  // Se obtienen los IDs antes de actualizar para poder notificar a cada
  // proveedor (updateMany no permite ejecutar un side-effect por documento).
  const vencidos = await Payment.find(criterio).select('_id proveedor monto');
  if (vencidos.length === 0) return;

  await Payment.updateMany(criterio, { $set: { estado: 'liberado', fechaLiberacion: new Date() } });

  await Promise.all(
    vencidos.map((p) =>
      crearNotificacion(p.proveedor, 'pago_liberado', `Se liberó un pago de $${p.monto.toFixed(2)} a tu favor.`, '/dashboard')
    )
  );
};

// Llamado desde serviceRequestController al marcar una solicitud como completada:
// programa la liberación del pago retenido tras la ventana de disputa.
const programarLiberacion = async (solicitudId) => {
  const pago = await Payment.findOne({ solicitud: solicitudId, estado: 'retenido' });
  if (!pago) return;

  const fechaLiberacionProgramada = new Date(Date.now() + HORAS_RETENCION * 60 * 60 * 1000);
  pago.fechaLiberacionProgramada = fechaLiberacionProgramada;

  // Si la ventana de retención es 0, se libera de inmediato.
  if (HORAS_RETENCION <= 0) {
    pago.estado = 'liberado';
    pago.fechaLiberacion = new Date();
  }

  await pago.save();
};

// ── POST /api/payments (auth, proveedor) ──────────────────────────
// El proveedor genera un cobro para una solicitud aceptada o completada.
const crearPago = async (req, res) => {
  try {
    const { solicitudId, monto } = req.body;
    const montoNum = Number(monto);

    if (!solicitudId || !montoNum || montoNum <= 0) {
      return res.status(400).json({ error: 'solicitudId y un monto válido son requeridos' });
    }

    const solicitud = await ServiceRequest.findById(solicitudId);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (solicitud.proveedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para cobrar esta solicitud' });
    }
    if (!['aceptada', 'completada'].includes(solicitud.estado)) {
      return res.status(409).json({ error: 'Solo puedes cobrar solicitudes aceptadas o completadas' });
    }

    const existente = await Payment.findOne({ solicitud: solicitudId, estado: { $ne: 'fallido' } });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un cobro para esta solicitud', data: existente });
    }

    const comisionMonto  = Math.round(montoNum * (COMISION_PORCENTAJE / 100) * 100) / 100;
    const montoProveedor = Math.round((montoNum - comisionMonto) * 100) / 100;

    const pago = await Payment.create({
      solicitud: solicitudId,
      cliente: solicitud.cliente,
      proveedor: solicitud.proveedor,
      monto: montoNum,
      comisionPorcentaje: COMISION_PORCENTAJE,
      comisionMonto,
      montoProveedor,
    });

    res.status(201).json({ mensaje: 'Cobro generado. El cliente puede pagarlo ahora.', data: pago });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('crearPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/payments/mine (auth) ─────────────────────────────────
const getMisPagos = async (req, res) => {
  try {
    await liberarPagosVencidos({
      $or: [{ cliente: req.usuario._id }, { proveedor: req.usuario._id }],
    });

    const pagos = await Payment.find({
      $or: [{ cliente: req.usuario._id }, { proveedor: req.usuario._id }],
    })
      .populate('cliente', 'nombre')
      .populate('proveedor', 'nombre')
      .populate('solicitud', 'descripcion estado evidenciaCompletado')
      .sort({ createdAt: -1 });

    res.json({ data: pagos, total: pagos.length });
  } catch (err) {
    console.error('getMisPagos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/payments/:id/pay (auth, cliente) ────────────────────
// Inicia el cobro. En modo 'live' devuelve la URL de checkout de PayPhone;
// en modo 'demo' indica al frontend que use el formulario de tarjeta simulado.
const iniciarPago = async (req, res) => {
  try {
    const pago = await Payment.findById(req.params.id).populate('solicitud', 'descripcion');
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.cliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para pagar este cobro' });
    }
    if (pago.estado !== 'pendiente' && pago.estado !== 'fallido') {
      return res.status(409).json({ error: `Este cobro ya está en estado '${pago.estado}'` });
    }

    if (!modoLive) {
      return res.json({ modo: 'demo' });
    }

    const clientTransactionId = `${pago._id}-${Date.now()}`;
    const origen = `${req.protocol}://${req.get('host')}`;
    const { urlPago } = await payphoneService.prepararPago({
      clientTransactionId,
      monto: pago.monto,
      referencia: pago.solicitud?.descripcion?.slice(0, 60) ?? 'Servicio ServiLink',
      // Sin query string propia: PayPhone añade sus propios parámetros (id, clientTransactionId)
      // al final de la URL, así que el pagoId va en el path para no romper el formato.
      responseUrl: `${origen}/pagos/confirmacion/${pago._id}`,
    });

    pago.clientTransactionId = clientTransactionId;
    await pago.save();

    res.json({ modo: 'live', urlPago });
  } catch (err) {
    console.error('iniciarPago:', err);
    res.status(500).json({ error: 'Error al iniciar el pago con la pasarela' });
  }
};

// ── POST /api/payments/:id/confirmar-payphone (auth, cliente) ────
// Confirma server-a-servidor el resultado real de la transacción en PayPhone
// tras la redirección de vuelta. Nunca se confía en el estado reportado
// únicamente por el navegador del cliente.
const confirmarPagoPayphone = async (req, res) => {
  try {
    const { transactionId, clientTransactionId } = req.body;
    if (!transactionId || !clientTransactionId) {
      return res.status(400).json({ error: 'transactionId y clientTransactionId son requeridos' });
    }

    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.cliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para confirmar este cobro' });
    }
    if (pago.clientTransactionId !== clientTransactionId) {
      return res.status(400).json({ error: 'La transacción no corresponde a este cobro' });
    }
    if (pago.estado !== 'pendiente' && pago.estado !== 'fallido') {
      return res.status(409).json({ error: `Este cobro ya está en estado '${pago.estado}'` });
    }

    const resultado = await payphoneService.confirmarTransaccion({
      id: transactionId,
      clientTransactionId,
    });

    // Verificación de integridad: el monto aprobado por PayPhone debe coincidir con el cobro.
    const montoValido = Math.abs(resultado.montoAprobado - pago.monto) < 0.01;

    if (!resultado.aprobado || !montoValido) {
      pago.estado = 'fallido';
      await pago.save();
      return res.status(402).json({ error: 'El pago no fue aprobado por la pasarela', data: pago });
    }

    pago.estado                = 'retenido';
    pago.transaccionExternaId  = resultado.referenciaExterna;
    pago.fechaPago             = new Date();
    await pago.save();

    await crearNotificacion(pago.proveedor, 'pago_retenido', `El cliente pagó $${pago.monto.toFixed(2)}. Se liberará cuando completes el servicio.`, '/dashboard');

    res.json({ mensaje: 'Pago confirmado y retenido hasta que el servicio se complete', data: pago });
  } catch (err) {
    console.error('confirmarPagoPayphone:', err);
    res.status(500).json({ error: 'Error al confirmar el pago con la pasarela' });
  }
};

// ── POST /api/payments/:id/confirm (auth, cliente) ────────────────
// Modo DEMO/sandbox: simula el procesamiento de una pasarela con una
// tarjeta de prueba. Solo disponible cuando PAYPHONE_MODE no es 'live'.
// Tarjeta de prueba para simular fallo: cualquier número terminado en 0000.
const confirmarPago = async (req, res) => {
  try {
    if (modoLive) {
      return res.status(400).json({ error: 'El modo demostración está deshabilitado en producción' });
    }

    const { numeroTarjeta, nombreTitular, fechaExpiracion, cvv } = req.body;

    if (!numeroTarjeta || !nombreTitular || !fechaExpiracion || !cvv) {
      return res.status(400).json({ error: 'Todos los datos de la tarjeta son requeridos' });
    }

    const numeroLimpio = numeroTarjeta.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(numeroLimpio)) {
      return res.status(400).json({ error: 'El número de tarjeta debe tener 16 dígitos' });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ error: 'CVV inválido' });
    }
    if (!/^\d{2}\/\d{2}$/.test(fechaExpiracion)) {
      return res.status(400).json({ error: 'Formato de expiración inválido (MM/AA)' });
    }

    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

    if (pago.cliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para pagar este cobro' });
    }
    if (pago.estado !== 'pendiente' && pago.estado !== 'fallido') {
      return res.status(409).json({ error: `Este cobro ya está en estado '${pago.estado}'` });
    }

    // Simulación de la pasarela local: las tarjetas terminadas en 0000 se rechazan a propósito.
    const aprobado = !numeroLimpio.endsWith('0000');

    if (!aprobado) {
      pago.estado = 'fallido';
      await pago.save();
      return res.status(402).json({ error: 'El pago fue rechazado por la pasarela', data: pago });
    }

    pago.estado               = 'retenido';
    pago.transaccionExternaId = `DEMO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    pago.fechaPago            = new Date();
    await pago.save();

    await crearNotificacion(pago.proveedor, 'pago_retenido', `El cliente pagó $${pago.monto.toFixed(2)}. Se liberará cuando completes el servicio.`, '/dashboard');

    res.json({ mensaje: 'Pago confirmado y retenido hasta que el servicio se complete', data: pago });
  } catch (err) {
    console.error('confirmarPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/payments/:id/disputar (auth, cliente) ───────────────
// El cliente puede reportar un problema mientras el pago esté retenido
// o mientras no haya vencido la ventana de liberación tras completarse.
const disputarPago = async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo?.trim()) {
      return res.status(400).json({ error: 'El motivo de la disputa es requerido' });
    }

    const pago = await Payment.findById(req.params.id)
      .populate('proveedor', 'nombre telefono')
      .populate('cliente', 'nombre');
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.cliente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para disputar este cobro' });
    }
    if (!['retenido', 'liberado'].includes(pago.estado)) {
      return res.status(409).json({ error: 'Solo puedes disputar un pago retenido o recién liberado' });
    }

    pago.estado   = 'en_disputa';
    pago.disputa  = { motivo: motivo.trim(), fecha: new Date(), resuelta: false, resolucion: '', respuestaProveedor: null };
    await pago.save();

    // El proveedor tiene la oportunidad de responder con su versión y evidencia
    // antes de que un admin decida (igual que el Resolution Center de Airbnb).
    await notificarDisputaAbierta(pago.proveedor.telefono, pago.proveedor.nombre, pago.cliente.nombre, motivo.trim());
    await crearNotificacion(pago.proveedor._id, 'disputa_abierta', `${pago.cliente.nombre} abrió una disputa sobre un pago. Puedes responder antes de que un admin decida.`, '/dashboard');

    res.json({ mensaje: 'Disputa registrada. El proveedor puede responder antes de que un administrador decida.', data: pago });
  } catch (err) {
    console.error('disputarPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/payments/:id/responder-disputa (auth, proveedor) ───
// El proveedor presenta su versión y evidencia adicional mientras la
// disputa está abierta y aún no ha respondido.
const responderDisputa = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto?.trim()) {
      return res.status(400).json({ error: 'La respuesta es requerida' });
    }

    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.proveedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta disputa' });
    }
    if (pago.estado !== 'en_disputa') {
      return res.status(409).json({ error: 'Este pago no tiene una disputa abierta' });
    }
    if (pago.disputa.respuestaProveedor) {
      return res.status(409).json({ error: 'Ya respondiste esta disputa' });
    }

    pago.disputa.respuestaProveedor = {
      texto: texto.trim(),
      evidencia: (req.files ?? []).map((f) => `/uploads/${f.filename}`),
      fecha: new Date(),
    };
    await pago.save();

    res.json({ mensaje: 'Respuesta enviada. Un administrador revisará ambas versiones.', data: pago });
  } catch (err) {
    console.error('responderDisputa:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  crearPago,
  getMisPagos,
  iniciarPago,
  confirmarPagoPayphone,
  confirmarPago,
  disputarPago,
  responderDisputa,
  liberarPagosVencidos,
  programarLiberacion,
};
