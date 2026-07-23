const mongoose = require('mongoose');
const Message  = require('../models/Message');
const User     = require('../models/User');

// ── GET /api/messages/conversations (auth) ────────────────────────
// Lista los contactos con los que el usuario tiene conversación, con
// el último mensaje y el conteo de mensajes no leídos.
const getConversaciones = async (req, res) => {
  try {
    const miId = req.usuario._id;

    const conversaciones = await Message.aggregate([
      { $match: { $or: [{ de: miId }, { para: miId }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          contacto: { $cond: [{ $eq: ['$de', miId] }, '$para', '$de'] },
        },
      },
      {
        $group: {
          _id: '$contacto',
          ultimoMensaje: { $first: '$$ROOT' },
          noLeidos: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$para', miId] }, { $eq: ['$leido', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'ultimoMensaje.createdAt': -1 } },
    ]);

    const contactos = await User.find({ _id: { $in: conversaciones.map((c) => c._id) } })
      .select('nombre fotoPerfil roles')
      .lean();
    const contactosMap = new Map(contactos.map((c) => [c._id.toString(), c]));

    const data = conversaciones.map((c) => ({
      usuario: contactosMap.get(c._id.toString()) ?? null,
      ultimoMensaje: c.ultimoMensaje,
      noLeidos: c.noLeidos,
    })).filter((c) => c.usuario);

    res.json({ data });
  } catch (err) {
    console.error('getConversaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/messages/:userId (auth) ──────────────────────────────
// Historial de mensajes entre el usuario autenticado y userId.
// Marca como leídos los mensajes recibidos de userId.
const getConversacion = async (req, res) => {
  try {
    const { userId } = req.params;
    const miId = req.usuario._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Identificador de usuario inválido' });
    }

    const otroUsuario = await User.findById(userId).select('nombre fotoPerfil roles activo');
    if (!otroUsuario || !otroUsuario.activo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const mensajes = await Message.find({
      $or: [
        { de: miId, para: userId },
        { de: userId, para: miId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { de: userId, para: miId, leido: false },
      { $set: { leido: true } }
    );

    res.json({ data: mensajes, usuario: otroUsuario });
  } catch (err) {
    console.error('getConversacion:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/messages (auth) ─────────────────────────────────────
const enviarMensaje = async (req, res) => {
  try {
    const { paraId, contenido } = req.body;

    if (!paraId || !contenido?.trim()) {
      return res.status(400).json({ error: 'paraId y contenido son requeridos' });
    }
    if (!mongoose.Types.ObjectId.isValid(paraId)) {
      return res.status(400).json({ error: 'Identificador de destinatario inválido' });
    }
    if (paraId === req.usuario._id.toString()) {
      return res.status(400).json({ error: 'No puedes enviarte un mensaje a ti mismo' });
    }

    const destinatario = await User.findById(paraId);
    if (!destinatario || !destinatario.activo) {
      return res.status(404).json({ error: 'Destinatario no encontrado' });
    }

    const mensaje = await Message.create({
      de: req.usuario._id,
      para: paraId,
      contenido: contenido.trim(),
    });

    res.status(201).json({ mensaje: 'Mensaje enviado', data: mensaje });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('enviarMensaje:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getConversaciones, getConversacion, enviarMensaje };
