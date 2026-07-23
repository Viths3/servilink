/**
 * Notificaciones internas de la app (icono de campana en la navbar) —
 * complementan, sin reemplazar, los avisos de WhatsApp: quedan en un
 * historial dentro de la plataforma con estado leída/no leída.
 */
const Notification = require('../models/Notification');

const crearNotificacion = async (usuarioId, tipo, mensaje, link = '') => {
  try {
    await Notification.create({ usuario: usuarioId, tipo, mensaje, link });
  } catch (err) {
    // Nunca debe romper el flujo principal (aceptar solicitud, pagar, etc.)
    console.error('crearNotificacion:', err);
  }
};

module.exports = { crearNotificacion };
