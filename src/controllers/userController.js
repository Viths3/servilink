const User = require('../models/User');

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
const updateMe = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    const cambios = {};
    if (nombre) cambios.nombre = nombre.trim();
    if (telefono) cambios.telefono = telefono;

    const usuario = await User.findByIdAndUpdate(
      req.usuario._id,
      cambios,
      { new: true, runValidators: true }
    );

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
// Sube documentos de verificación para un proveedor existente.
// Multer ya procesó los archivos antes de llegar aquí.
const subirDocumentos = async (req, res) => {
  try {
    if (!req.usuario.roles.includes('proveedor') || !req.usuario.providerData) {
      return res.status(403).json({ error: 'Solo proveedores pueden subir documentos de verificación' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes subir al menos un documento' });
    }

    const documentos = req.files.map((f) => `/uploads/${f.filename}`);

    const usuario = await User.findByIdAndUpdate(
      req.usuario._id,
      {
        'providerData.documentos': documentos,
        'providerData.verificationStatus': 'pendiente',
      },
      { new: true }
    );

    res.json({
      mensaje: 'Documentos cargados. Tu verificación está en proceso.',
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
      'nombre fotoPerfil roles providerData.categoria providerData.descripcion providerData.verificationStatus'
    );

    if (!usuario || !usuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ data: usuario });
  } catch (err) {
    console.error('getPerfilPublico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getMe, updateMe, subirDocumentos, getPerfilPublico };
