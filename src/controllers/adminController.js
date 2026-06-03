const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');
const {
  notificarVerificacionAprobada,
  notificarVerificacionRechazada,
  notificarUpgradeAprobado,
  notificarUpgradeRechazado,
} = require('../services/whatsappService');

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

    if (usuario.providerData.verificationStatus !== 'pendiente') {
      return res.status(409).json({ error: 'Esta verificación no está en estado pendiente' });
    }

    usuario.providerData.verificationStatus = accion === 'aprobar' ? 'aprobado' : 'rechazado';
    usuario.providerData.comentarioAdmin = comentario?.trim() || '';
    usuario.providerData.fechaVerificacion = new Date();

    await usuario.save();

    if (accion === 'aprobar') {
      await notificarVerificacionAprobada(usuario.telefono, usuario.nombre);
    } else {
      await notificarVerificacionRechazada(usuario.telefono, usuario.nombre, comentario.trim());
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
    } else {
      await notificarUpgradeRechazado(usuario.telefono, usuario.nombre, comentario.trim());
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

module.exports = {
  getVerificaciones,
  procesarVerificacion,
  getUpgradeRequests,
  procesarUpgrade,
};
