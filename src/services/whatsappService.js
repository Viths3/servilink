/**
 * WhatsApp Business Cloud API — Meta
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * REQUIERE:
 * - WHATSAPP_TOKEN en .env
 * - WHATSAPP_PHONE_NUMBER_ID en .env
 * - Plantillas aprobadas en Meta Business Manager
 */

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

/**
 * Envía un mensaje de WhatsApp usando una plantilla aprobada.
 * @param {string} telefono - Número en formato E.164 (ej: +593991234567)
 * @param {string} plantilla - Nombre de la plantilla aprobada en Meta
 * @param {Array}  params    - Array de strings para los parámetros {{1}}, {{2}}, etc.
 */
const sendWhatsApp = async (telefono, plantilla, params = []) => {
  // En desarrollo, solo loguear (evita consumir la API sin plantillas reales)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📱 [WhatsApp DEV] → ${telefono} | plantilla: ${plantilla} | params: ${JSON.stringify(params)}`);
    return { success: true, dev: true };
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'template',
        template: {
          name: plantilla,
          language: { code: 'es' },
          components: params.length > 0
            ? [{
                type: 'body',
                parameters: params.map((p) => ({ type: 'text', text: String(p) })),
              }]
            : [],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err) {
    console.error('sendWhatsApp error:', err.message);
    return { success: false, error: err.message };
  }
};

// ── Funciones por evento (RF-07, RF-12, RF-17, RF-22) ─────────────

// RF-07: Resultado de verificación de proveedor
const notificarVerificacionAprobada = (telefono, nombre) =>
  sendWhatsApp(telefono, 'verificacion_aprobada', [nombre]);

const notificarVerificacionRechazada = (telefono, nombre, motivo) =>
  sendWhatsApp(telefono, 'verificacion_rechazada', [nombre, motivo]);

// RF-12 Evento 1: Nueva solicitud recibida (al proveedor)
const notificarNuevaSolicitud = (telefono, nombreProveedor, nombreCliente, fecha) =>
  sendWhatsApp(telefono, 'nueva_solicitud', [nombreProveedor, nombreCliente, fecha]);

// RF-12 Evento 2: Cita confirmada (al cliente)
const notificarCitaConfirmada = (telefono, nombreCliente, nombreProveedor, fecha) =>
  sendWhatsApp(telefono, 'cita_confirmada', [nombreCliente, nombreProveedor, fecha]);

// RF-12 Evento 3: Cita rechazada (al cliente)
const notificarCitaRechazada = (telefono, nombreCliente, nombreProveedor, motivo) =>
  sendWhatsApp(telefono, 'cita_rechazada', [nombreCliente, nombreProveedor, motivo]);

// RF-12 Evento 4: Reagendamiento propuesto (al cliente)
const notificarReagendamiento = (telefono, nombreCliente, nombreProveedor, nuevaFecha) =>
  sendWhatsApp(telefono, 'reagendamiento_propuesto', [nombreCliente, nombreProveedor, nuevaFecha]);

// RF-12 Evento 5: Respuesta al reagendamiento (al proveedor)
const notificarRespuestaReagendamiento = (telefono, nombreProveedor, respuesta) =>
  sendWhatsApp(telefono, 'respuesta_reagendamiento', [nombreProveedor, respuesta]);

// RF-17: Resultado upgrade de rol
const notificarUpgradeAprobado = (telefono, nombre) =>
  sendWhatsApp(telefono, 'upgrade_aprobado', [nombre]);

const notificarUpgradeRechazado = (telefono, nombre, motivo) =>
  sendWhatsApp(telefono, 'upgrade_rechazado', [nombre, motivo]);

// RF-22: Acción sobre anuncio reportado
const notificarAnuncioEditado = (telefono, nombre, tituloAnuncio, motivo) =>
  sendWhatsApp(telefono, 'anuncio_editado', [nombre, tituloAnuncio, motivo]);

const notificarAnuncioSuspendido = (telefono, nombre, tituloAnuncio, motivo) =>
  sendWhatsApp(telefono, 'anuncio_suspendido', [nombre, tituloAnuncio, motivo]);

module.exports = {
  sendWhatsApp,
  notificarVerificacionAprobada,
  notificarVerificacionRechazada,
  notificarNuevaSolicitud,
  notificarCitaConfirmada,
  notificarCitaRechazada,
  notificarReagendamiento,
  notificarRespuestaReagendamiento,
  notificarUpgradeAprobado,
  notificarUpgradeRechazado,
  notificarAnuncioEditado,
  notificarAnuncioSuspendido,
};
