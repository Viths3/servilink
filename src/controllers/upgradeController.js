const User = require('../models/User');
const UpgradeRequest = require('../models/UpgradeRequest');

// ── RF-16: POST /api/upgrade-requests ────────────────────────────
// Cliente solicita convertirse en proveedor.
const solicitarUpgrade = async (req, res) => {
  try {
    if (req.usuario.roles.includes('proveedor')) {
      return res.status(409).json({ error: 'Ya tienes el rol de proveedor' });
    }

    const { cedula, categoria, descripcion } = req.body;

    if (!cedula || !categoria) {
      return res.status(400).json({ error: 'Cédula y categoría son requeridas' });
    }

    if (!User.validarCedula(cedula)) {
      return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
    }

    // Verificar que la cédula no esté en uso por otro proveedor
    const cedulaEnUso = await User.findOne({ 'providerData.cedula': cedula });
    if (cedulaEnUso) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con esa cédula' });
    }

    // Solo puede haber una solicitud pendiente por usuario
    const pendienteExistente = await UpgradeRequest.findOne({
      usuario: req.usuario._id,
      estado: 'pendiente',
    });
    if (pendienteExistente) {
      return res.status(409).json({ error: 'Ya tienes una solicitud de upgrade pendiente de revisión' });
    }

    const documentos = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const solicitud = new UpgradeRequest({
      usuario: req.usuario._id,
      cedula,
      categoria,
      descripcion: descripcion || '',
      documentos,
    });

    await solicitud.save();

    res.status(201).json({
      mensaje: 'Solicitud enviada. El equipo revisará tu información y te notificará por WhatsApp.',
      data: solicitud,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('solicitarUpgrade:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/upgrade-requests/me ─────────────────────────────────
const getMiSolicitud = async (req, res) => {
  try {
    const solicitud = await UpgradeRequest.findOne({ usuario: req.usuario._id })
      .sort({ createdAt: -1 });

    if (!solicitud) {
      return res.status(404).json({ error: 'No tienes solicitudes de upgrade registradas' });
    }

    res.json({ data: solicitud });
  } catch (err) {
    console.error('getMiSolicitud:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { solicitarUpgrade, getMiSolicitud };
