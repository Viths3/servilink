const User           = require('../models/User');
const Announcement   = require('../models/Announcement');
const ServiceRequest = require('../models/ServiceRequest');
const Review         = require('../models/Review');
const { evaluarVerificacionAutomatica, COMENTARIO_AUTO } = require('../services/verificationService');
const { notificarVerificacionAprobada } = require('../services/whatsappService');

// ── RF-05 helper: GET /api/users/me ──────────────────────────────
const getMe = async (req, res) => {
  try {
    res.json({ data: req.usuario });
  } catch (err) {
    console.error('getMe:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/users/me ───────────────────────────────────────────
// Acepta multipart/form-data (para fotoPerfil) o application/json (para datos).
// Si se envían campos sensibles (nombre, telefono, password) se requiere passwordActual.
const updateMe = async (req, res) => {
  try {
    const { nombre, telefono, password, passwordActual } = req.body;
    const haySensibles = nombre || telefono || password;

    const usuario = await User.findById(req.usuario._id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (haySensibles) {
      if (!passwordActual) {
        return res.status(400).json({ error: 'La contraseña actual es requerida para actualizar los datos.' });
      }
      const valido = await usuario.compararPassword(passwordActual);
      if (!valido) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    if (nombre)   usuario.nombre    = nombre.trim();
    if (telefono) usuario.telefono  = telefono;
    if (password) usuario.password  = password; // pre-save hook hashea
    if (req.file) usuario.fotoPerfil = `/uploads/${req.file.filename}`;

    await usuario.save();

    res.json({ mensaje: 'Perfil actualizado', data: usuario });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('updateMe:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-05: POST /api/users/upload-docs ───────────────────────────
const subirDocumentos = async (req, res) => {
  try {
    if (!req.usuario.roles.includes('proveedor') || !req.usuario.providerData) {
      return res.status(403).json({ error: 'Solo proveedores pueden subir documentos de verificación' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes subir al menos un documento' });
    }

    const documentos = req.files.map((f) => `/uploads/${f.filename}`);

    // Verificación automática al subir documentos: si pasa los controles
    // objetivos, la cuenta queda aprobada al instante.
    const evaluacion = await evaluarVerificacionAutomatica({
      cedula: req.usuario.providerData.cedula,
      documentos,
      telefono: req.usuario.telefono,
      usuarioIdExcluir: req.usuario._id,
    });

    const actualizacion = {
      'providerData.documentos': documentos,
      'providerData.verificationStatus': evaluacion.aprobado ? 'aprobado' : 'pendiente',
    };
    if (evaluacion.aprobado) {
      actualizacion['providerData.comentarioAdmin'] = COMENTARIO_AUTO;
      actualizacion['providerData.fechaVerificacion'] = new Date();
    }

    const usuario = await User.findByIdAndUpdate(req.usuario._id, actualizacion, { new: true });

    if (evaluacion.aprobado) {
      await notificarVerificacionAprobada(usuario.telefono, usuario.nombre);
    }

    res.json({
      mensaje: evaluacion.aprobado
        ? '¡Documentos verificados! Tu cuenta de proveedor ya está activa.'
        : 'Documentos cargados. Tu verificación está en proceso.',
      data: {
        documentos: usuario.providerData.documentos,
        verificationStatus: usuario.providerData.verificationStatus,
      },
    });
  } catch (err) {
    console.error('subirDocumentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/users/:id/public ─────────────────────────────────────
const getPerfilPublico = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select(
      'nombre fotoPerfil roles activo providerData.categoria providerData.descripcion providerData.verificationStatus'
    );

    if (!usuario || !usuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [anuncios, solicitudesCompletadas, resenas, portafolio] = await Promise.all([
      Announcement.find({ proveedor: req.params.id, estado: 'activo' })
        .select('titulo descripcion categoria precioRef imagenUrl imagenes createdAt')
        .lean(),
      ServiceRequest.countDocuments({ proveedor: req.params.id, estado: 'completada' }),
      Review.find({ proveedor: req.params.id }).select('puntuacion').lean(),
      // Portafolio real: fotos que el proveedor subió al completar un servicio
      // (evidencia de pago), no anuncios activos — trabajos ya realizados.
      ServiceRequest.find({
        proveedor: req.params.id,
        estado: 'completada',
        evidenciaCompletado: { $exists: true, $ne: [] },
      })
        .select('descripcion evidenciaCompletado updatedAt')
        .sort({ updatedAt: -1 })
        .limit(24)
        .lean(),
    ]);

    const totalResenas    = resenas.length;
    const ratingPromedio   = totalResenas > 0
      ? Math.round((resenas.reduce((sum, r) => sum + r.puntuacion, 0) / totalResenas) * 10) / 10
      : 0;

    res.json({ data: { ...usuario.toJSON(), anuncios, solicitudesCompletadas, ratingPromedio, totalResenas, portafolio } });
  } catch (err) {
    console.error('getPerfilPublico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getMe, updateMe, subirDocumentos, getPerfilPublico };
