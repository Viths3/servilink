const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { uploadEvidencia, handleUploadError, verificarImagenes } = require('../middlewares/upload.middleware');
const {
  enviarSolicitud,
  getSolicitudesEnviadas,
  getSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
  reagendarSolicitud,
  aceptarReagendamiento,
  rechazarReagendamiento,
  completarSolicitud,
} = require('../controllers/serviceRequestController');
const { crearResena } = require('../controllers/reviewController');

/**
 * @openapi
 * tags:
 *   name: Solicitudes de servicio
 *   description: Ciclo completo de solicitudes entre clientes y proveedores (RF-12)
 */

// Todos los endpoints de solicitudes requieren JWT
router.use(auth);

/**
 * @openapi
 * /api/service-requests:
 *   post:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E1 Enviar solicitud de servicio
 *     description: >
 *       Cualquier usuario autenticado puede enviar una solicitud.
 *       El proveedor debe estar verificado (`verificationStatus: aprobado`).
 *       Un proveedor no puede enviarse una solicitud a sí mismo (regla de negocio 2).
 *       Notifica al proveedor por WhatsApp (evento 1).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proveedorId, descripcion, fechaPropuesta]
 *             properties:
 *               proveedorId:    { type: string, example: 664a1f2e3b4c5d6e7f8a9b0c }
 *               descripcion:    { type: string, example: Revisar el tablero eléctrico. }
 *               fechaPropuesta: { type: string, format: date-time, example: '2026-07-15T10:00:00.000Z' }
 *               anuncioId:      { type: string, description: Opcional, example: 664b2a3c4d5e6f7a8b9c0d1e }
 *     responses:
 *       201:
 *         description: Solicitud enviada. El proveedor recibe notificación por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       400:
 *         description: Campos faltantes, fecha pasada o proveedor no verificado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Proveedor o anuncio no encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', enviarSolicitud);

/**
 * @openapi
 * /api/service-requests/sent:
 *   get:
 *     tags: [Solicitudes de servicio]
 *     summary: Ver solicitudes enviadas por mí
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes enviadas por el usuario autenticado como cliente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/ServiceRequest' } }
 *                 total: { type: integer }
 */
router.get('/sent', getSolicitudesEnviadas);

/**
 * @openapi
 * /api/service-requests/received:
 *   get:
 *     tags: [Solicitudes de servicio]
 *     summary: Ver solicitudes recibidas (proveedor)
 *     description: Requiere rol `proveedor`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes recibidas por el proveedor autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/ServiceRequest' } }
 *                 total: { type: integer }
 *       403:
 *         description: El usuario no tiene rol de proveedor.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/received', role('proveedor'), getSolicitudesRecibidas);

/**
 * @openapi
 * /api/service-requests/{id}/accept:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E2 Aceptar solicitud
 *     description: >
 *       Solo el proveedor dueño de la solicitud. Estado debe ser `pendiente`.
 *       Notifica al cliente por WhatsApp (evento 2).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud aceptada. Cliente notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       403:
 *         description: No es el proveedor de esta solicitud.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: La solicitud no está en estado pendiente.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/accept', role('proveedor'), aceptarSolicitud);

/**
 * @openapi
 * /api/service-requests/{id}/reject:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E3 Rechazar solicitud
 *     description: >
 *       Solo el proveedor dueño de la solicitud. Estado debe ser `pendiente`.
 *       Notifica al cliente por WhatsApp (evento 3).
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
 *             required: [motivoRechazo]
 *             properties:
 *               motivoRechazo: { type: string, example: No tengo disponibilidad para esa fecha. }
 *     responses:
 *       200:
 *         description: Solicitud rechazada. Cliente notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       400:
 *         description: Motivo de rechazo requerido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: La solicitud no está en estado pendiente.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/reject', role('proveedor'), rechazarSolicitud);

/**
 * @openapi
 * /api/service-requests/{id}/reschedule:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E4 Proponer reagendamiento
 *     description: >
 *       El proveedor propone una nueva fecha. Estado válido: `pendiente` o `aceptada`.
 *       Notifica al cliente por WhatsApp (evento 4).
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
 *             required: [fechaPropuesta]
 *             properties:
 *               fechaPropuesta: { type: string, format: date-time, example: '2026-07-20T14:00:00.000Z' }
 *     responses:
 *       200:
 *         description: Reagendamiento propuesto. Cliente notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       400:
 *         description: Fecha requerida o fecha pasada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: El estado de la solicitud no permite reagendar.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/reschedule', role('proveedor'), reagendarSolicitud);

/**
 * @openapi
 * /api/service-requests/{id}/accept-reschedule:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E5a Cliente acepta reagendamiento
 *     description: >
 *       Solo el cliente dueño de la solicitud. Estado debe ser `reagendada`.
 *       `fechaConfirmada` toma el valor de `fechaPropuesta`.
 *       Notifica al proveedor por WhatsApp (evento 5).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reagendamiento aceptado. Proveedor notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       403:
 *         description: No es el cliente de esta solicitud.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: La solicitud no está en estado reagendada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/accept-reschedule', aceptarReagendamiento);

/**
 * @openapi
 * /api/service-requests/{id}/reject-reschedule:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: RF-12 E5b Cliente rechaza reagendamiento
 *     description: >
 *       Solo el cliente dueño de la solicitud. Estado debe ser `reagendada`.
 *       La solicitud pasa a `cancelada`.
 *       Notifica al proveedor por WhatsApp (evento 5).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reagendamiento rechazado. Solicitud cancelada. Proveedor notificado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/ServiceRequest' }
 *       403:
 *         description: No es el cliente de esta solicitud.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: La solicitud no está en estado reagendada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id/reject-reschedule', rechazarReagendamiento);

/**
 * @openapi
 * /api/service-requests/{id}/complete:
 *   patch:
 *     tags: [Solicitudes de servicio]
 *     summary: Marcar solicitud como completada
 *     description: Solo el proveedor dueño de la solicitud. Estado debe ser `aceptada`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Solicitud marcada como completada.
 *       403:
 *         description: No es el proveedor de esta solicitud.
 *       409:
 *         description: La solicitud no está en estado aceptada.
 */
router.patch('/:id/complete', role('proveedor'), uploadEvidencia, handleUploadError, verificarImagenes, completarSolicitud);

/**
 * @openapi
 * /api/service-requests/{id}/review:
 *   post:
 *     tags: [Solicitudes de servicio]
 *     summary: Calificar y reseñar una solicitud completada
 *     description: Solo el cliente de la solicitud, y solo una vez que el estado es `completada`.
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
 *             required: [puntuacion]
 *             properties:
 *               puntuacion: { type: integer, minimum: 1, maximum: 5 }
 *               comentario: { type: string }
 *     responses:
 *       201:
 *         description: Reseña publicada.
 *       403:
 *         description: No es el cliente de esta solicitud.
 *       409:
 *         description: Solicitud no completada o ya calificada.
 */
router.post('/:id/review', crearResena);

module.exports = router;
