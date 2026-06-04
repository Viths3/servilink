const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const {
  notificarNuevaSolicitud,
  notificarCitaConfirmada,
  notificarCitaRechazada,
  notificarReagendamiento,
  notificarRespuestaReagendamiento,
} = require('../services/whatsappService');

// Formatear fecha para mensajes de WhatsApp
const formatFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  });

// ── RF-12 E1: POST /api/service-requests (auth) ──────────────────
// Cualquier usuario autenticado puede enviar una solicitud.
// Regla de negocio: un proveedor no puede enviarse solicitud a sí mismo.
const enviarSolicitud = async (req, res) => {
  try {
    const { proveedorId, descripcion, fechaPropuesta, anuncioId } = req.body;

    if (!proveedorId || !descripcion || !fechaPropuesta) {
      return res.status(400).json({ error: 'proveedorId, descripción y fechaPropuesta son requeridos' });
    }

    // Regla 2: no puede enviarse a sí mismo
    if (proveedorId === req.usuario._id.toString()) {
      return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo' });
    }

    const proveedor = await User.findById(proveedorId);
    if (!proveedor || !proveedor.activo) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    if (!proveedor.roles.includes('proveedor') || proveedor.providerData?.verificationStatus !== 'aprobado') {
      return res.status(400).json({ error: 'El destinatario no es un proveedor verificado' });
    }

    // Validar anuncio opcional
    if (anuncioId) {
      const anuncio = await Announcement.findOne({ _id: anuncioId, estado: 'activo' });
      if (!anuncio) {
        return res.status(404).json({ error: 'Anuncio no encontrado o inactivo' });
      }
      if (anuncio.proveedor.toString() !== proveedorId) {
        return res.status(400).json({ error: 'El anuncio no pertenece al proveedor indicado' });
      }
    }

    const fechaDate = new Date(fechaPropuesta);
    if (isNaN(fechaDate.getTime()) || fechaDate <= new Date()) {
      return res.status(400).json({ error: 'La fecha propuesta debe ser una fecha futura válida' });
    }

    const solicitud = new ServiceRequest({
      cliente: req.usuario._id,
      proveedor: proveedorId,
      anuncio: anuncioId || null,
      descripcion: descripcion.trim(),
      fechaPropuesta: fechaDate,
    });

    await solicitud.save();

    // RF-12 Evento 1: notificar al proveedor
    await notificarNuevaSolicitud(
      proveedor.telefono,
      proveedor.nombre,
      req.usuario.nombre,
      formatFecha(fechaDate)
    );

    res.status(201).json({
      mensaje: 'Solicitud enviada correctamente',
      data: solicitud,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('enviarSolicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/service-requests/sent (auth) ────────────────────────
const getSolicitudesEnviadas = async (req, res) => {
  try {
    const solicitudes = await ServiceRequest.find({ cliente: req.usuario._id })
      .populate('proveedor', 'nombre fotoPerfil telefono')
      .populate('anuncio', 'titulo categoria')
      .sort({ createdAt: -1 });

    res.json({ data: solicitudes, total: solicitudes.length });
  } catch (err) {
    console.error('getSolicitudesEnviadas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/service-requests/received (auth, proveedor) ─────────
const getSolicitudesRecibidas = async (req, res) => {
  try {
    const solicitudes = await ServiceRequest.find({ proveedor: req.usuario._id })
      .populate('cliente', 'nombre fotoPerfil telefono')
      .populate('anuncio', 'titulo categoria')
      .sort({ createdAt: -1 });

    res.json({ data: solicitudes, total: solicitudes.length });
  } catch (err) {
    console.error('getSolicitudesRecibidas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Helpers: extraen el ObjectId independientemente de si el campo está populado o no.
// Cuando populate() se ejecuta, el campo pasa de ser ObjectId a un documento completo;
// en ese caso .toString() devuelve "[object Object]", de ahí la necesidad de ._id.
const verificarProveedor = (solicitud, usuarioId) => {
  const id = solicitud.proveedor._id ?? solicitud.proveedor;
  return id.toString() === usuarioId.toString();
};

const verificarCliente = (solicitud, usuarioId) => {
  const id = solicitud.cliente._id ?? solicitud.cliente;
  return id.toString() === usuarioId.toString();
};

// ── RF-12 E2: PATCH /api/service-requests/:id/accept ─────────────
const aceptarSolicitud = async (req, res) => {
  try {
    const solicitud = await ServiceRequest.findById(req.params.id)
      .populate('cliente', 'nombre telefono')
      .populate('proveedor', 'nombre');

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (!verificarProveedor(solicitud, req.usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar esta solicitud' });
    }
    if (solicitud.estado !== 'pendiente') {
      return res.status(409).json({ error: `La solicitud está en estado '${solicitud.estado}', no se puede aceptar` });
    }

    solicitud.estado = 'aceptada';
    solicitud.fechaConfirmada = solicitud.fechaPropuesta;
    await solicitud.save();

    // RF-12 Evento 2: notificar al cliente
    await notificarCitaConfirmada(
      solicitud.cliente.telefono,
      solicitud.cliente.nombre,
      solicitud.proveedor.nombre,
      formatFecha(solicitud.fechaConfirmada)
    );

    res.json({ mensaje: 'Solicitud aceptada', data: solicitud });
  } catch (err) {
    console.error('aceptarSolicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-12 E3: PATCH /api/service-requests/:id/reject ─────────────
const rechazarSolicitud = async (req, res) => {
  try {
    const { motivoRechazo } = req.body;

    if (!motivoRechazo?.trim()) {
      return res.status(400).json({ error: 'El motivo de rechazo es requerido' });
    }

    const solicitud = await ServiceRequest.findById(req.params.id)
      .populate('cliente', 'nombre telefono')
      .populate('proveedor', 'nombre');

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (!verificarProveedor(solicitud, req.usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar esta solicitud' });
    }
    if (solicitud.estado !== 'pendiente') {
      return res.status(409).json({ error: `La solicitud está en estado '${solicitud.estado}', no se puede rechazar` });
    }

    solicitud.estado = 'rechazada';
    solicitud.motivoRechazo = motivoRechazo.trim();
    await solicitud.save();

    // RF-12 Evento 3: notificar al cliente
    await notificarCitaRechazada(
      solicitud.cliente.telefono,
      solicitud.cliente.nombre,
      solicitud.proveedor.nombre,
      solicitud.motivoRechazo
    );

    res.json({ mensaje: 'Solicitud rechazada', data: solicitud });
  } catch (err) {
    console.error('rechazarSolicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-12 E4: PATCH /api/service-requests/:id/reschedule ─────────
const reagendarSolicitud = async (req, res) => {
  try {
    const { fechaPropuesta } = req.body;

    if (!fechaPropuesta) {
      return res.status(400).json({ error: 'La nueva fecha propuesta es requerida' });
    }

    const fechaDate = new Date(fechaPropuesta);
    if (isNaN(fechaDate.getTime()) || fechaDate <= new Date()) {
      return res.status(400).json({ error: 'La nueva fecha debe ser una fecha futura válida' });
    }

    const solicitud = await ServiceRequest.findById(req.params.id)
      .populate('cliente', 'nombre telefono')
      .populate('proveedor', 'nombre');

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (!verificarProveedor(solicitud, req.usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para gestionar esta solicitud' });
    }
    if (!['pendiente', 'aceptada'].includes(solicitud.estado)) {
      return res.status(409).json({ error: `La solicitud está en estado '${solicitud.estado}', no se puede reagendar` });
    }

    solicitud.estado = 'reagendada';
    solicitud.fechaPropuesta = fechaDate;
    solicitud.fechaConfirmada = null;
    await solicitud.save();

    // RF-12 Evento 4: notificar al cliente
    await notificarReagendamiento(
      solicitud.cliente.telefono,
      solicitud.cliente.nombre,
      solicitud.proveedor.nombre,
      formatFecha(fechaDate)
    );

    res.json({ mensaje: 'Reagendamiento propuesto al cliente', data: solicitud });
  } catch (err) {
    console.error('reagendarSolicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-12 E5a: PATCH /api/service-requests/:id/accept-reschedule ─
const aceptarReagendamiento = async (req, res) => {
  try {
    const solicitud = await ServiceRequest.findById(req.params.id)
      .populate('proveedor', 'nombre telefono')
      .populate('cliente', 'nombre');

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (!verificarCliente(solicitud, req.usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta solicitud' });
    }
    if (solicitud.estado !== 'reagendada') {
      return res.status(409).json({ error: 'La solicitud no está en estado reagendada' });
    }

    solicitud.estado = 'aceptada';
    solicitud.fechaConfirmada = solicitud.fechaPropuesta;
    await solicitud.save();

    // RF-12 Evento 5: notificar al proveedor
    await notificarRespuestaReagendamiento(
      solicitud.proveedor.telefono,
      solicitud.proveedor.nombre,
      'aceptado'
    );

    res.json({ mensaje: 'Reagendamiento aceptado', data: solicitud });
  } catch (err) {
    console.error('aceptarReagendamiento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-12 E5b: PATCH /api/service-requests/:id/reject-reschedule ─
const rechazarReagendamiento = async (req, res) => {
  try {
    const solicitud = await ServiceRequest.findById(req.params.id)
      .populate('proveedor', 'nombre telefono')
      .populate('cliente', 'nombre');

    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (!verificarCliente(solicitud, req.usuario._id)) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta solicitud' });
    }
    if (solicitud.estado !== 'reagendada') {
      return res.status(409).json({ error: 'La solicitud no está en estado reagendada' });
    }

    solicitud.estado = 'cancelada';
    await solicitud.save();

    // RF-12 Evento 5: notificar al proveedor
    await notificarRespuestaReagendamiento(
      solicitud.proveedor.telefono,
      solicitud.proveedor.nombre,
      'rechazado'
    );

    res.json({ mensaje: 'Reagendamiento rechazado. La solicitud fue cancelada.', data: solicitud });
  } catch (err) {
    console.error('rechazarReagendamiento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  enviarSolicitud,
  getSolicitudesEnviadas,
  getSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
  reagendarSolicitud,
  aceptarReagendamiento,
  rechazarReagendamiento,
};
