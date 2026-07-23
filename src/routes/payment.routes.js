const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { uploadEvidencia, handleUploadError, verificarImagenes } = require('../middlewares/upload.middleware');
const {
  crearPago,
  getMisPagos,
  iniciarPago,
  confirmarPagoPayphone,
  confirmarPago,
  disputarPago,
  responderDisputa,
} = require('../controllers/paymentController');

/**
 * @openapi
 * tags:
 *   name: Pagos
 *   description: Pagos en línea vía PayPhone con retención de fondos (escrow) hasta completar el servicio
 */

router.use(auth);

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Pagos]
 *     summary: Generar un cobro para una solicitud (proveedor)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [solicitudId, monto]
 *             properties:
 *               solicitudId: { type: string }
 *               monto:       { type: number }
 *     responses:
 *       201:
 *         description: Cobro generado.
 *       409:
 *         description: Ya existe un cobro para esta solicitud.
 */
router.post('/', role('proveedor'), crearPago);

/**
 * @openapi
 * /api/payments/mine:
 *   get:
 *     tags: [Pagos]
 *     summary: Ver mis pagos (como cliente o proveedor)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagos del usuario autenticado.
 */
router.get('/mine', getMisPagos);

/**
 * @openapi
 * /api/payments/{id}/pay:
 *   post:
 *     tags: [Pagos]
 *     summary: Iniciar el pago de un cobro pendiente (cliente)
 *     description: >
 *       En modo `live` devuelve la URL de checkout hospedado de PayPhone
 *       a la que se debe redirigir al cliente. En modo `demo` indica al
 *       frontend que use el formulario de tarjeta simulado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Modo de pago y, en modo live, URL de checkout.
 */
router.post('/:id/pay', iniciarPago);

/**
 * @openapi
 * /api/payments/{id}/confirmar-payphone:
 *   post:
 *     tags: [Pagos]
 *     summary: Confirmar server-a-servidor una transacción de PayPhone
 *     description: >
 *       Se llama tras la redirección de vuelta desde PayPhone. Valida la
 *       transacción directamente contra la API de PayPhone antes de
 *       marcar el pago como retenido — nunca se confía solo en la URL
 *       de retorno del navegador.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, clientTransactionId]
 *             properties:
 *               transactionId:       { type: string }
 *               clientTransactionId: { type: string }
 *     responses:
 *       200:
 *         description: Pago confirmado y retenido.
 *       402:
 *         description: Pago no aprobado por la pasarela.
 */
router.post('/:id/confirmar-payphone', confirmarPagoPayphone);

/**
 * @openapi
 * /api/payments/{id}/confirm:
 *   post:
 *     tags: [Pagos]
 *     summary: Pagar un cobro pendiente en modo demostración (cliente)
 *     description: >
 *       Solo disponible cuando la pasarela no está en modo `live`.
 *       Simula el procesamiento de un pago con tarjeta.
 *       Tarjetas de prueba terminadas en 0000 se rechazan intencionalmente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numeroTarjeta, nombreTitular, fechaExpiracion, cvv]
 *             properties:
 *               numeroTarjeta:   { type: string, example: '4111111111111111' }
 *               nombreTitular:   { type: string }
 *               fechaExpiracion: { type: string, example: '12/28' }
 *               cvv:             { type: string, example: '123' }
 *     responses:
 *       200:
 *         description: Pago procesado correctamente.
 *       402:
 *         description: Pago rechazado por la pasarela.
 *       409:
 *         description: El cobro ya fue procesado.
 */
router.post('/:id/confirm', confirmarPago);

/**
 * @openapi
 * /api/payments/{id}/disputar:
 *   post:
 *     tags: [Pagos]
 *     summary: Reportar un problema con un pago retenido (cliente)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo]
 *             properties:
 *               motivo: { type: string }
 *     responses:
 *       200:
 *         description: Disputa registrada.
 */
router.post('/:id/disputar', disputarPago);

/**
 * @openapi
 * /api/payments/{id}/responder-disputa:
 *   post:
 *     tags: [Pagos]
 *     summary: Responder a una disputa abierta (proveedor)
 *     description: >
 *       El proveedor presenta su versión y evidencia adicional antes de
 *       que un administrador resuelva la disputa — solo se puede
 *       responder una vez.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [texto]
 *             properties:
 *               texto:     { type: string }
 *               evidencia:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Respuesta registrada.
 *       409:
 *         description: No hay disputa abierta o ya respondiste.
 */
router.post('/:id/responder-disputa', role('proveedor'), uploadEvidencia, handleUploadError, verificarImagenes, responderDisputa);

module.exports = router;
