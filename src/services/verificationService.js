/**
 * Verificación automática de proveedores.
 *
 * Aprueba al instante a los proveedores cuyos datos pasan TODOS los
 * controles objetivos, eliminando la espera por revisión manual:
 *   1. Cédula ecuatoriana válida (algoritmo módulo 10).
 *   2. Cédula no registrada por otro proveedor.
 *   3. Al menos un documento de identidad adjunto.
 *   4. Teléfono en formato ecuatoriano válido (+593...).
 *
 * Seguridad que se mantiene:
 *   - Si CUALQUIER control falla, la solicitud queda 'pendiente' y pasa
 *     a la cola de revisión manual del admin (comportamiento anterior).
 *   - El admin puede revocar una verificación aprobada en cualquier
 *     momento (y desactivar la cuenta), incluso si fue automática.
 *   - Cada aprobación automática queda registrada en comentarioAdmin
 *     para poder auditarla después.
 *   - Se puede desactivar globalmente con AUTO_VERIFY=false en el .env.
 */
const User = require('../models/User');

const AUTO_VERIFY = (process.env.AUTO_VERIFY ?? 'true').toLowerCase() !== 'false';

const evaluarVerificacionAutomatica = async ({ cedula, documentos, telefono, usuarioIdExcluir = null }) => {
  if (!AUTO_VERIFY) {
    return { aprobado: false, motivo: 'Verificación automática deshabilitada' };
  }

  if (!User.validarCedula(cedula)) {
    return { aprobado: false, motivo: 'Cédula inválida' };
  }

  const filtroCedula = { 'providerData.cedula': cedula };
  if (usuarioIdExcluir) filtroCedula._id = { $ne: usuarioIdExcluir };
  const cedulaEnUso = await User.findOne(filtroCedula);
  if (cedulaEnUso) {
    return { aprobado: false, motivo: 'Cédula ya registrada por otro usuario' };
  }

  if (!documentos || documentos.length === 0) {
    return { aprobado: false, motivo: 'Sin documentos de identidad adjuntos' };
  }

  if (!/^\+593\d{9}$/.test(telefono ?? '')) {
    return { aprobado: false, motivo: 'Teléfono no es un número ecuatoriano válido' };
  }

  return { aprobado: true, motivo: '' };
};

const COMENTARIO_AUTO = 'Aprobado automáticamente: cédula válida y única, documentos adjuntos y teléfono verificado. Sujeto a auditoría posterior.';

module.exports = { evaluarVerificacionAutomatica, COMENTARIO_AUTO };
