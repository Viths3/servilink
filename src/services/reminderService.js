/**
 * Recordatorios automáticos por WhatsApp.
 *
 * Se ejecuta periódicamente (ver server.js) y revisa tres cosas:
 * 1) Visitas/citas confirmadas que ocurren en las próximas 24h.
 * 2) Solicitudes que el proveedor aún no responde (pendiente hace >24h).
 * 3) Cobros que el cliente aún no paga (pendiente hace >24h).
 *
 * Cada aviso se envía una sola vez por elemento gracias a las banderas
 * `recordatorio*Enviado` — no importa cada cuánto corra este job, nunca
 * duplica un recordatorio ya enviado.
 */
const ServiceRequest = require('../models/ServiceRequest');
const Payment         = require('../models/Payment');
const {
  notificarRecordatorioVisita,
  notificarRecordatorioSolicitudPendiente,
  notificarRecordatorioPago,
} = require('./whatsappService');

const formatFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  });

const HORA_MS = 60 * 60 * 1000;

// ── 1) Recordatorio de visita en las próximas 24h ─────────────────
const recordarVisitasProximas = async () => {
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * HORA_MS);

  const solicitudes = await ServiceRequest.find({
    estado: 'aceptada',
    fechaConfirmada: { $gte: ahora, $lte: en24h },
    recordatorioVisitaEnviado: false,
  })
    .populate('cliente', 'nombre telefono')
    .populate('proveedor', 'nombre telefono');

  for (const s of solicitudes) {
    const fecha = formatFecha(s.fechaConfirmada);
    await notificarRecordatorioVisita(s.cliente.telefono, s.cliente.nombre, s.proveedor.nombre, fecha);
    await notificarRecordatorioVisita(s.proveedor.telefono, s.proveedor.nombre, s.cliente.nombre, fecha);
    s.recordatorioVisitaEnviado = true;
    await s.save();
  }
};

// ── 2) Recordatorio de solicitud pendiente hace más de 24h ────────
const recordarSolicitudesPendientes = async () => {
  const hace24h = new Date(Date.now() - 24 * HORA_MS);

  const solicitudes = await ServiceRequest.find({
    estado: 'pendiente',
    createdAt: { $lte: hace24h },
    recordatorioPendienteEnviado: false,
  })
    .populate('cliente', 'nombre')
    .populate('proveedor', 'nombre telefono');

  for (const s of solicitudes) {
    await notificarRecordatorioSolicitudPendiente(s.proveedor.telefono, s.proveedor.nombre, s.cliente.nombre);
    s.recordatorioPendienteEnviado = true;
    await s.save();
  }
};

// ── 3) Recordatorio de cobro pendiente de pago hace más de 24h ───
const recordarPagosPendientes = async () => {
  const hace24h = new Date(Date.now() - 24 * HORA_MS);

  const pagos = await Payment.find({
    estado: 'pendiente',
    createdAt: { $lte: hace24h },
    recordatorioPagoEnviado: false,
  })
    .populate('cliente', 'nombre telefono')
    .populate('proveedor', 'nombre');

  for (const p of pagos) {
    await notificarRecordatorioPago(p.cliente.telefono, p.cliente.nombre, p.proveedor.nombre, p.monto.toFixed(2));
    p.recordatorioPagoEnviado = true;
    await p.save();
  }
};

const runRecordatorios = async () => {
  try {
    await recordarVisitasProximas();
    await recordarSolicitudesPendientes();
    await recordarPagosPendientes();
  } catch (err) {
    console.error('runRecordatorios:', err);
  }
};

module.exports = { runRecordatorios };
