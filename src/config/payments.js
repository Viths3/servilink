// ── Configuración del modelo de pagos (escrow) ────────────────────
// COMISION_PORCENTAJE: % que retiene ServiLink de cada transacción.
// HORAS_RETENCION: ventana de disputa tras marcar un servicio como
//                  completado, antes de liberar el pago al proveedor.
// PAYPHONE_MODE: 'live' usa la API real de PayPhone; cualquier otro
//                valor (o ausencia de credenciales) cae en modo 'demo'
//                (tarjeta simulada), útil para desarrollo y la tesis.
const COMISION_PORCENTAJE = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 10);
const HORAS_RETENCION     = Number(process.env.PAYMENT_HOLD_HOURS ?? 48);

const PAYPHONE_TOKEN    = process.env.PAYPHONE_TOKEN ?? '';
const PAYPHONE_STORE_ID = process.env.PAYPHONE_STORE_ID ?? '';
const PAYPHONE_MODE     = (process.env.PAYPHONE_MODE ?? 'demo').toLowerCase();

const modoLive = PAYPHONE_MODE === 'live' && Boolean(PAYPHONE_TOKEN) && Boolean(PAYPHONE_STORE_ID);

module.exports = {
  COMISION_PORCENTAJE,
  HORAS_RETENCION,
  PAYPHONE_TOKEN,
  PAYPHONE_STORE_ID,
  modoLive,
};
