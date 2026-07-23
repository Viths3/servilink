const Review          = require('../models/Review');
const ServiceRequest  = require('../models/ServiceRequest');
const { crearNotificacion } = require('../services/notificationService');

// ── POST /api/service-requests/:id/review (auth, cliente) ────────
// Solo el cliente de una solicitud completada puede dejar una reseña, una sola vez.
const crearResena = async (req, res) => {
  try {
    const { puntuacion, comentario } = req.body;

    const puntuacionNum = Number(puntuacion);
    if (!puntuacionNum || puntuacionNum < 1 || puntuacionNum > 5) {
      return res.status(400).json({ error: 'La puntuación debe ser un número entre 1 y 5' });
    }

    const solicitud = await ServiceRequest.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (solicitud.cliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para calificar esta solicitud' });
    }
    if (solicitud.estado !== 'completada') {
      return res.status(409).json({ error: 'Solo puedes calificar solicitudes completadas' });
    }

    const existente = await Review.findOne({ solicitud: solicitud._id });
    if (existente) {
      return res.status(409).json({ error: 'Ya calificaste esta solicitud' });
    }

    const resena = await Review.create({
      solicitud: solicitud._id,
      cliente: solicitud.cliente,
      proveedor: solicitud.proveedor,
      puntuacion: puntuacionNum,
      comentario: comentario?.trim() ?? '',
    });

    await crearNotificacion(solicitud.proveedor, 'resena_recibida', `Recibiste una reseña de ${puntuacionNum} estrella${puntuacionNum !== 1 ? 's' : ''}.`, `/usuarios/${solicitud.proveedor}/public`);

    res.status(201).json({ mensaje: 'Reseña publicada', data: resena });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya calificaste esta solicitud' });
    }
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('crearResena:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/users/:id/reviews (público) ──────────────────────────
const getResenasProveedor = async (req, res) => {
  try {
    const resenas = await Review.find({ proveedor: req.params.id })
      .populate('cliente', 'nombre fotoPerfil')
      .sort({ createdAt: -1 });

    const total = resenas.length;
    const promedio = total > 0
      ? resenas.reduce((sum, r) => sum + r.puntuacion, 0) / total
      : 0;

    res.json({
      data: resenas,
      total,
      promedio: Math.round(promedio * 10) / 10,
    });
  } catch (err) {
    console.error('getResenasProveedor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { crearResena, getResenasProveedor };
