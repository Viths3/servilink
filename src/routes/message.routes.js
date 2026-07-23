const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { getConversaciones, getConversacion, enviarMensaje } = require('../controllers/messageController');

/**
 * @openapi
 * tags:
 *   name: Mensajería
 *   description: Mensajería interna entre clientes y proveedores
 */

router.use(auth);

/**
 * @openapi
 * /api/messages/conversations:
 *   get:
 *     tags: [Mensajería]
 *     summary: Listar conversaciones del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones con último mensaje y no leídos.
 */
router.get('/conversations', getConversaciones);

/**
 * @openapi
 * /api/messages/{userId}:
 *   get:
 *     tags: [Mensajería]
 *     summary: Ver historial de mensajes con un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Historial de mensajes.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get('/:userId', getConversacion);

/**
 * @openapi
 * /api/messages:
 *   post:
 *     tags: [Mensajería]
 *     summary: Enviar un mensaje
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paraId, contenido]
 *             properties:
 *               paraId:    { type: string }
 *               contenido: { type: string }
 *     responses:
 *       201:
 *         description: Mensaje enviado.
 *       404:
 *         description: Destinatario no encontrado.
 */
router.post('/', enviarMensaje);

module.exports = router;
