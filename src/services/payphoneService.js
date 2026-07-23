/**
 * Integración con PayPhone (Botón de Pago) — https://payphone.app
 *
 * REQUIERE (modo 'live'):
 * - PAYPHONE_TOKEN     en .env (token de la app creada en el panel de PayPhone)
 * - PAYPHONE_STORE_ID  en .env (identificador de tienda/comercio)
 * - PAYPHONE_MODE=live en .env
 *
 * Flujo:
 * 1) prepararPago(): crea la transacción en PayPhone y devuelve la URL de
 *    checkout hospedado a la que se redirige al cliente.
 * 2) PayPhone redirige de vuelta a la app con ?id=...&clientTransactionId=...
 * 3) confirmarTransaccion(): se valida SIEMPRE server-a-servidor contra la
 *    API de PayPhone antes de confiar en el resultado — nunca se acepta el
 *    estado de pago solo porque el navegador volvió a una URL de éxito.
 *
 * ⚠️ Antes de salir a producción: verificar los nombres exactos de los
 * campos contra la documentación vigente de PayPhone (pueden variar entre
 * versiones de su API) y probar en su entorno sandbox con credenciales reales.
 */
const { PAYPHONE_TOKEN, PAYPHONE_STORE_ID } = require('../config/payments');

const BASE_URL = 'https://pay.payphonetodoesposible.com/api';

// fetch() nativo no tiene timeout por defecto — si PayPhone no responde, la
// petición (y la conexión del cliente esperando la respuesta HTTP) quedaría
// colgada indefinidamente. Con AbortController se corta a los 10s y se
// convierte en un error normal que el controlador ya sabe manejar.
const TIMEOUT_MS = 10_000;
const fetchConTimeout = async (url, opciones) => {
  const controlador = new AbortController();
  const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opciones, signal: controlador.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('PayPhone no respondió a tiempo. Intenta de nuevo en unos minutos.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

const prepararPago = async ({ clientTransactionId, monto, referencia, responseUrl, cancelUrl }) => {
  const montoCentavos = Math.round(monto * 100);

  const respuesta = await fetchConTimeout(`${BASE_URL}/button/Prepare`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYPHONE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: montoCentavos,
      amountWithoutTax: montoCentavos,
      amountWithTax: 0,
      tax: 0,
      service: 0,
      tip: 0,
      currency: 'USD',
      storeId: PAYPHONE_STORE_ID,
      reference: referencia,
      clientTransactionId,
      responseUrl,
      cancelUrl: cancelUrl ?? responseUrl,
    }),
  });

  const data = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(data?.message ?? 'No se pudo iniciar la transacción con PayPhone');
  }

  return {
    urlPago: data.payWithCard,
    paymentId: data.paymentId,
  };
};

const confirmarTransaccion = async ({ id, clientTransactionId }) => {
  const respuesta = await fetchConTimeout(`${BASE_URL}/button/V2/Confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYPHONE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, clientTxId: clientTransactionId }),
  });

  const data = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(data?.message ?? 'No se pudo confirmar la transacción con PayPhone');
  }

  return {
    aprobado: data.transactionStatus === 'Approved',
    montoAprobado: (data.amount ?? 0) / 100,
    referenciaExterna: String(data.transactionId ?? id),
    raw: data,
  };
};

module.exports = { prepararPago, confirmarTransaccion };
