const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');
const Announcement = require('../models/Announcement');
const ServiceRequest = require('../models/ServiceRequest');
const Payment = require('../models/Payment');
const { liberarPagosVencidos } = require('./paymentController');
const {
  notificarVerificacionAprobada,
  notificarVerificacionRechazada,
  notificarUpgradeAprobado,
  notificarUpgradeRechazado,
  notificarAnuncioEditado,
  notificarAnuncioSuspendido,
  notificarDisputaResuelta,
} = require('../services/whatsappService');
const { crearNotificacion } = require('../services/notificationService');

// ── RF-06: GET /api/admin/verifications ───────────────────────────
// Lista proveedores con verificationStatus='pendiente'.
const getVerificaciones = async (req, res) => {
  try {
    const usuarios = await User.find({
      roles: 'proveedor',
      'providerData.verificationStatus': 'pendiente',
    }).select('-password').sort({ createdAt: 1 });

    res.json({ data: usuarios, total: usuarios.length });
  } catch (err) {
    console.error('getVerificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-07: PATCH /api/admin/verifications/:id ─────────────────────
// Aprueba o rechaza la verificación de un proveedor.
const procesarVerificacion = async (req, res) => {
  try {
    const { accion, comentario } = req.body;

    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'La acción debe ser "aprobar" o "rechazar"' });
    }

    if (accion === 'rechazar' && !comentario?.trim()) {
      return res.status(400).json({ error: 'El comentario es requerido al rechazar' });
    }

    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.roles.includes('proveedor') || !usuario.providerData) {
      return res.status(400).json({ error: 'El usuario no tiene rol de proveedor' });
    }

    // Se puede aprobar/rechazar una pendiente, y también REVOCAR (rechazar)
    // una ya aprobada — respaldo de auditoría para las aprobaciones automáticas.
    const estadoActual = usuario.providerData.verificationStatus;
    const esRevocacion = accion === 'rechazar' && estadoActual === 'aprobado';
    if (estadoActual !== 'pendiente' && !esRevocacion) {
      return res.status(409).json({ error: 'Esta verificación no está en estado pendiente' });
    }

    usuario.providerData.verificationStatus = accion === 'aprobar' ? 'aprobado' : 'rechazado';
    usuario.providerData.comentarioAdmin = comentario?.trim() || '';
    usuario.providerData.fechaVerificacion = new Date();

    await usuario.save();

    if (accion === 'aprobar') {
      await notificarVerificacionAprobada(usuario.telefono, usuario.nombre);
      await crearNotificacion(usuario._id, 'verificacion_aprobada', 'Tu identidad fue verificada. Ya puedes publicar servicios.', '/dashboard');
    } else {
      await notificarVerificacionRechazada(usuario.telefono, usuario.nombre, comentario.trim());
      await crearNotificacion(usuario._id, 'verificacion_rechazada', `Tu verificación fue rechazada: ${comentario.trim()}`, '/dashboard');
    }

    res.json({
      mensaje: `Verificación ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`,
      data: {
        usuarioId: usuario._id,
        verificationStatus: usuario.providerData.verificationStatus,
      },
    });
  } catch (err) {
    console.error('procesarVerificacion:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-17: GET /api/admin/upgrade-requests ────────────────────────
// Lista solicitudes de upgrade con estado='pendiente'.
const getUpgradeRequests = async (req, res) => {
  try {
    const solicitudes = await UpgradeRequest.find({ estado: 'pendiente' })
      .populate('usuario', 'nombre email telefono roles')
      .sort({ createdAt: 1 });

    res.json({ data: solicitudes, total: solicitudes.length });
  } catch (err) {
    console.error('getUpgradeRequests:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-17: PATCH /api/admin/upgrade-requests/:id ─────────────────
// Aprueba o rechaza una solicitud de upgrade.
// Si aprueba: push 'proveedor' a roles[], crea providerData con status='aprobado'.
const procesarUpgrade = async (req, res) => {
  try {
    const { accion, comentario } = req.body;

    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'La acción debe ser "aprobar" o "rechazar"' });
    }

    if (accion === 'rechazar' && !comentario?.trim()) {
      return res.status(400).json({ error: 'El comentario es requerido al rechazar' });
    }

    const solicitud = await UpgradeRequest.findById(req.params.id).populate('usuario');
    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitud.estado !== 'pendiente') {
      return res.status(409).json({ error: 'Esta solicitud ya fue procesada' });
    }

    // Actualizar la solicitud
    solicitud.estado = accion === 'aprobar' ? 'aprobada' : 'rechazada';
    solicitud.comentario = comentario?.trim() || '';
    solicitud.revisadoPor = req.usuario._id;
    await solicitud.save();

    const usuario = solicitud.usuario;

    if (accion === 'aprobar') {
      // RF-15: rol dual — agregar 'proveedor' sin quitar 'cliente'
      if (!usuario.roles.includes('proveedor')) {
        usuario.roles.push('proveedor');
      }
      // Establecer providerData directamente aprobado (el admin ya verificó en este paso)
      usuario.providerData = {
        cedula: solicitud.cedula,
        categoria: solicitud.categoria,
        descripcion: solicitud.descripcion,
        verificationStatus: 'aprobado',
        documentos: solicitud.documentos,
        fechaVerificacion: new Date(),
      };
      await usuario.save();
      await notificarUpgradeAprobado(usuario.telefono, usuario.nombre);
      await crearNotificacion(usuario._id, 'upgrade_aprobado', '¡Tu solicitud para ser proveedor fue aprobada!', '/dashboard');
    } else {
      await notificarUpgradeRechazado(usuario.telefono, usuario.nombre, comentario.trim());
      await crearNotificacion(usuario._id, 'upgrade_rechazado', `Tu solicitud para ser proveedor fue rechazada: ${comentario.trim()}`, '/dashboard');
    }

    res.json({
      mensaje: `Solicitud de upgrade ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`,
      data: {
        solicitudId: solicitud._id,
        estado: solicitud.estado,
      },
    });
  } catch (err) {
    console.error('procesarUpgrade:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-18: GET /api/admin/stats ───────────────────────────────────
// Métricas generales del dashboard.
const getStats = async (req, res) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      totalProveedores,
      totalClientes,
      verificacionesPendientes,
      upgradesPendientes,
      totalAnuncios,
      anunciosActivos,
      anunciosSuspendidos,
      anunciosConReportes,
      totalSolicitudes,
      solicitudesPorEstado,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ activo: true }),
      User.countDocuments({ roles: 'proveedor' }),
      User.countDocuments({ roles: 'cliente' }),
      User.countDocuments({ roles: 'proveedor', 'providerData.verificationStatus': 'pendiente' }),
      UpgradeRequest.countDocuments({ estado: 'pendiente' }),
      Announcement.countDocuments(),
      Announcement.countDocuments({ estado: 'activo' }),
      Announcement.countDocuments({ estado: 'suspendido' }),
      Announcement.countDocuments({ reportes: { $elemMatch: { revisado: false } } }),
      ServiceRequest.countDocuments(),
      ServiceRequest.aggregate([
        { $group: { _id: '$estado', total: { $sum: 1 } } },
      ]),
    ]);

    const solicitudesResumen = solicitudesPorEstado.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {});

    res.json({
      data: {
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          inactivos: totalUsuarios - usuariosActivos,
          proveedores: totalProveedores,
          clientes: totalClientes,
        },
        pendientes: {
          verificaciones: verificacionesPendientes,
          upgrades: upgradesPendientes,
        },
        anuncios: {
          total: totalAnuncios,
          activos: anunciosActivos,
          suspendidos: anunciosSuspendidos,
          conReportesActivos: anunciosConReportes,
        },
        solicitudes: {
          total: totalSolicitudes,
          porEstado: solicitudesResumen,
        },
      },
    });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-19: GET /api/admin/users ───────────────────────────────────
// Lista todos los usuarios con filtros opcionales y paginación.
const getUsuarios = async (req, res) => {
  try {
    const { rol, activo, page = 1, limit = 20 } = req.query;

    const filtro = {};
    if (rol) filtro.roles = rol;
    if (activo !== undefined) filtro.activo = activo === 'true';

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [usuarios, total] = await Promise.all([
      User.find(filtro)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filtro),
    ]);

    res.json({
      data: usuarios,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('getUsuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-19: PATCH /api/admin/users/:id ────────────────────────────
// Activa o desactiva un usuario.
// Regla 5: el admin NO puede desactivar otra cuenta de admin.
const toggleUsuario = async (req, res) => {
  try {
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo "activo" debe ser true o false' });
    }

    const usuario = await User.findById(req.params.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Regla 5: no se puede desactivar a otro admin
    if (!activo && usuario.roles.includes('admin')) {
      return res.status(403).json({ error: 'No puedes desactivar una cuenta de administrador' });
    }

    usuario.activo = activo;
    await usuario.save();

    res.json({
      mensaje: `Cuenta ${activo ? 'activada' : 'desactivada'} correctamente`,
      data: { usuarioId: usuario._id, activo: usuario.activo },
    });
  } catch (err) {
    console.error('toggleUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-22: GET /api/admin/announcements/reported ──────────────────
// Lista anuncios que tienen al menos un reporte sin revisar.
const getAnunciosReportados = async (req, res) => {
  try {
    const anuncios = await Announcement.find({
      reportes: { $elemMatch: { revisado: false } },
    })
      .populate('proveedor', 'nombre email telefono')
      .sort({ createdAt: -1 });

    res.json({ data: anuncios, total: anuncios.length });
  } catch (err) {
    console.error('getAnunciosReportados:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-22: PATCH /api/admin/announcements/:id ─────────────────────
// Acciones: 'editar' | 'suspender' | 'desestimar'
// editar: actualiza campos del anuncio y notifica al proveedor por WA.
// suspender: cambia estado a 'suspendido' y notifica por WA.
// desestimar: marca todos los reportes como revisado=true (sin acción sobre el anuncio).
const gestionarAnuncioReportado = async (req, res) => {
  try {
    const { accion, motivo, titulo, descripcion, categoria, precioRef } = req.body;

    if (!['editar', 'suspender', 'desestimar'].includes(accion)) {
      return res.status(400).json({ error: 'La acción debe ser "editar", "suspender" o "desestimar"' });
    }

    if (['editar', 'suspender'].includes(accion) && !motivo?.trim()) {
      return res.status(400).json({ error: 'El motivo es requerido para esta acción' });
    }

    const anuncio = await Announcement.findById(req.params.id)
      .populate('proveedor', 'nombre telefono');

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    if (accion === 'editar') {
      if (!titulo && !descripcion && !categoria && precioRef == null) {
        return res.status(400).json({ error: 'Debes proporcionar al menos un campo para editar' });
      }
      if (titulo) anuncio.titulo = titulo.trim();
      if (descripcion) anuncio.descripcion = descripcion.trim();
      if (categoria) anuncio.categoria = categoria;
      if (precioRef != null) anuncio.precioRef = Number(precioRef);

      // Marcar reportes como revisados
      anuncio.reportes.forEach((r) => { r.revisado = true; });
      await anuncio.save();

      await notificarAnuncioEditado(
        anuncio.proveedor.telefono,
        anuncio.proveedor.nombre,
        anuncio.titulo,
        motivo.trim()
      );
      await crearNotificacion(anuncio.proveedor._id, 'anuncio_editado', `Un admin editó tu anuncio "${anuncio.titulo}": ${motivo.trim()}`, `/anuncios/${anuncio._id}`);
    } else if (accion === 'suspender') {
      if (anuncio.estado === 'suspendido') {
        return res.status(409).json({ error: 'El anuncio ya está suspendido' });
      }
      anuncio.estado = 'suspendido';
      anuncio.reportes.forEach((r) => { r.revisado = true; });
      await anuncio.save();

      await notificarAnuncioSuspendido(
        anuncio.proveedor.telefono,
        anuncio.proveedor.nombre,
        anuncio.titulo,
        motivo.trim()
      );
      await crearNotificacion(anuncio.proveedor._id, 'anuncio_suspendido', `Tu anuncio "${anuncio.titulo}" fue suspendido: ${motivo.trim()}`, `/anuncios/${anuncio._id}`);
    } else {
      // desestimar: solo marcar reportes como revisados
      anuncio.reportes.forEach((r) => { r.revisado = true; });
      await anuncio.save();
    }

    res.json({
      mensaje: `Anuncio ${accion === 'editar' ? 'editado' : accion === 'suspender' ? 'suspendido' : 'reportes desestimados'} correctamente`,
      data: { anuncioId: anuncio._id, estado: anuncio.estado },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('gestionarAnuncioReportado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Eliminar foto de perfil de usuario ──────────────────────────────
const eliminarFotoPerfilUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuario.fotoPerfil = 'REMOVED_BY_MODERATOR';
    await usuario.save();

    res.json({
      mensaje: 'Foto de perfil eliminada',
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        fotoPerfil: usuario.fotoPerfil,
      },
    });
  } catch (err) {
    console.error('eliminarFotoPerfilUsuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/admin/payments ────────────────────────────────────────
// Lista pagos filtrando por estado (ej. 'liberado' = listos para liquidar
// al proveedor, 'en_disputa' = pendientes de resolución).
const getPagos = async (req, res) => {
  try {
    await liberarPagosVencidos();

    const { estado } = req.query;
    const filtro = estado ? { estado } : {};

    const pagos = await Payment.find(filtro)
      .populate('cliente', 'nombre email')
      .populate('proveedor', 'nombre email')
      .populate('solicitud', 'descripcion estado evidenciaCompletado')
      .sort({ createdAt: -1 });

    res.json({ data: pagos, total: pagos.length });
  } catch (err) {
    console.error('getPagos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/admin/payments/:id/pay-out ─────────────────────────
// El admin confirma que ya transfirió manualmente al proveedor el monto
// que le corresponde (monto - comisión), tras verificar el estado del pago.
const marcarPagadoProveedor = async (req, res) => {
  try {
    const { referenciaTransferencia } = req.body;
    if (!referenciaTransferencia?.trim()) {
      return res.status(400).json({ error: 'La referencia de la transferencia es requerida' });
    }

    const pago = await Payment.findById(req.params.id);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.estado !== 'liberado') {
      return res.status(409).json({ error: 'Solo se pueden liquidar pagos en estado "liberado"' });
    }

    pago.estado = 'pagado';
    pago.referenciaTransferencia = referenciaTransferencia.trim();
    pago.fechaPagadoProveedor = new Date();
    await pago.save();

    res.json({ mensaje: 'Pago liquidado al proveedor', data: pago });
  } catch (err) {
    console.error('marcarPagadoProveedor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/admin/payments/:id/resolve-dispute ─────────────────
// resolucion: 'liberar' (el servicio sí se cumplió, se libera al proveedor)
//           | 'reembolsar' (se reembolsa al cliente fuera de la plataforma)
const resolverDisputaPago = async (req, res) => {
  try {
    const { resolucion } = req.body;
    if (!['liberar', 'reembolsar'].includes(resolucion)) {
      return res.status(400).json({ error: 'La resolución debe ser "liberar" o "reembolsar"' });
    }

    const pago = await Payment.findById(req.params.id)
      .populate('cliente', 'nombre telefono')
      .populate('proveedor', 'nombre telefono');
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pago.estado !== 'en_disputa') {
      return res.status(409).json({ error: 'Este pago no tiene una disputa abierta' });
    }

    pago.disputa.resuelta = true;
    pago.disputa.resolucion = resolucion;
    pago.estado = resolucion === 'liberar' ? 'liberado' : 'fallido';
    if (resolucion === 'liberar') pago.fechaLiberacion = new Date();
    await pago.save();

    const resultadoTexto = resolucion === 'liberar'
      ? 'Se determinó que el servicio sí se completó — el pago será liberado al proveedor.'
      : 'Se determinó reembolsar al cliente.';
    await Promise.all([
      notificarDisputaResuelta(pago.cliente.telefono, pago.cliente.nombre, resultadoTexto),
      notificarDisputaResuelta(pago.proveedor.telefono, pago.proveedor.nombre, resultadoTexto),
      crearNotificacion(pago.cliente._id, 'disputa_resuelta', resultadoTexto, '/dashboard'),
      crearNotificacion(pago.proveedor._id, 'disputa_resuelta', resultadoTexto, '/dashboard'),
    ]);

    res.json({ mensaje: 'Disputa resuelta', data: pago });
  } catch (err) {
    console.error('resolverDisputaPago:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getVerificaciones,
  procesarVerificacion,
  getUpgradeRequests,
  procesarUpgrade,
  getStats,
  getUsuarios,
  toggleUsuario,
  getAnunciosReportados,
  gestionarAnuncioReportado,
  eliminarFotoPerfilUsuario,
  getPagos,
  marcarPagadoProveedor,
  resolverDisputaPago,
};
