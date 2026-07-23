const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const {
  getMisNotificaciones,
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} = require('../controllers/notificationController');

/**
 * @openapi
 * tags:
 *   name: Notificaciones
 *   description: Centro de notificaciones internas de la app
 */

router.use(auth);

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Ver mis notificaciones recientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones y conteo de no leídas.
 */
router.get('/', getMisNotificaciones);

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Ver solo el conteo de notificaciones no leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo de no leídas.
 */
router.get('/unread-count', getConteoNoLeidas);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar una notificación como leída
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notificación marcada como leída.
 */
router.patch('/:id/read', marcarLeida);

/**
 * @openapi
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar todas mis notificaciones como leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones marcadas como leídas.
 */
router.patch('/read-all', marcarTodasLeidas);

module.exports = router;
