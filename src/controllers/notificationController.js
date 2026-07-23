const Notification = require('../models/Notification');

// ── GET /api/notifications (auth) ─────────────────────────────────
const getMisNotificaciones = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const notificaciones = await Notification.find({ usuario: req.usuario._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const noLeidas = await Notification.countDocuments({ usuario: req.usuario._id, leida: false });

    res.json({ data: notificaciones, noLeidas });
  } catch (err) {
    console.error('getMisNotificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/notifications/unread-count (auth) ────────────────────
const getConteoNoLeidas = async (req, res) => {
  try {
    const noLeidas = await Notification.countDocuments({ usuario: req.usuario._id, leida: false });
    res.json({ noLeidas });
  } catch (err) {
    console.error('getConteoNoLeidas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/notifications/:id/read (auth) ──────────────────────
const marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notification.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario._id },
      { leida: true },
      { new: true }
    );
    if (!notificacion) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json({ data: notificacion });
  } catch (err) {
    console.error('marcarLeida:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/notifications/read-all (auth) ──────────────────────
const marcarTodasLeidas = async (req, res) => {
  try {
    await Notification.updateMany({ usuario: req.usuario._id, leida: false }, { leida: true });
    res.json({ mensaje: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    console.error('marcarTodasLeidas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getMisNotificaciones, getConteoNoLeidas, marcarLeida, marcarTodasLeidas };
