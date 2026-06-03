const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const {
  getVerificaciones,
  procesarVerificacion,
  getUpgradeRequests,
  procesarUpgrade,
  getStats,
  getUsuarios,
  toggleUsuario,
  getAnunciosReportados,
  gestionarAnuncioReportado,
} = require('../controllers/adminController');

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Panel de administración. Todos los endpoints requieren rol `admin`.
 */

// Todos los endpoints /admin/* requieren JWT + rol admin
router.use(auth, role('admin'));

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: RF-18 Métricas del dashboard
 *     description: >
 *       Devuelve conteos de usuarios, anuncios y solicitudes calculados
 *       en una sola llamada paralela con `Promise.all`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas del sistema.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuarios:
 *                       type: object
 *                       properties:
 *                         total:       { type: integer }
 *                         activos:     { type: integer }
 *                         inactivos:   { type: integer }
 *                         proveedores: { type: integer }
 *                         clientes:    { type: integer }
 *                     pendientes:
 *                       type: object
 *                       properties:
 *                         verificaciones: { type: integer }
 *                         upgrades:       { type: integer }
 *                     anuncios:
 *                       type: object
 *                       properties:
 *                         total:             { type: integer }
 *                         activos:           { type: integer }
 *                         suspendidos:       { type: integer }
 *                         conReportesActivos:{ type: integer }
 *                     solicitudes:
 *                       type: object
 *                       properties:
 *                         total:     { type: integer }
 *                         porEstado: { type: object }
 */
router.get('/stats', getStats);

/**
 * @openapi
 * /api/admin/verifications:
 *   get:
 *     tags: [Admin]
 *     summary: RF-06 Ver verificaciones pendientes
 *     description: Lista todos los proveedores con `verificationStatus` en `pendiente`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores pendientes de verificación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/User' } }
 *                 total: { type: integer }
 */
router.get('/verifications', getVerificaciones);

/**
 * @openapi
 * /api/admin/verifications/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: RF-07 Aprobar o rechazar verificación de proveedor
 *     description: >
 *       `comentario` es obligatorio al rechazar.
 *       Notifica al proveedor por WhatsApp en ambos casos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del usuario proveedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accion]
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [aprobar, rechazar]
 *               comentario:
 *                 type: string
 *                 description: Requerido si accion es "rechazar"
 *                 example: La cédula presentada está ilegible.
 *     responses:
 *       200:
 *         description: Verificación procesada. Proveedor notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:            { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuarioId:          { type: string }
 *                     verificationStatus: { type: string }
 *       400:
 *         description: Acción inválida, comentario faltante al rechazar, o usuario sin rol proveedor.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: La verificación no está en estado pendiente.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/verifications/:id', procesarVerificacion);

/**
 * @openapi
 * /api/admin/upgrade-requests:
 *   get:
 *     tags: [Admin]
 *     summary: RF-17 Ver upgrades de rol pendientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes de upgrade en estado pendiente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/UpgradeRequest' } }
 *                 total: { type: integer }
 */
router.get('/upgrade-requests', getUpgradeRequests);

/**
 * @openapi
 * /api/admin/upgrade-requests/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: RF-17 Aprobar o rechazar upgrade de rol
 *     description: >
 *       Si aprueba: agrega `proveedor` a `roles[]` (RF-15 rol dual) y crea
 *       `providerData` con `verificationStatus: aprobado`.
 *       `comentario` es obligatorio al rechazar.
 *       Notifica al usuario por WhatsApp en ambos casos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del UpgradeRequest
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accion]
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [aprobar, rechazar]
 *               comentario:
 *                 type: string
 *                 description: Requerido si accion es "rechazar"
 *     responses:
 *       200:
 *         description: Upgrade procesado. Usuario notificado por WhatsApp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     solicitudId: { type: string }
 *                     estado:      { type: string }
 *       409:
 *         description: La solicitud ya fue procesada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/upgrade-requests/:id', procesarUpgrade);

/**
 * @openapi
 * /api/admin/announcements/reported:
 *   get:
 *     tags: [Admin]
 *     summary: RF-22 Ver anuncios con reportes sin revisar
 *     description: Lista anuncios que tienen al menos un reporte pendiente de revisión (revisado false).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de anuncios reportados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/Announcement' } }
 *                 total: { type: integer }
 */
router.get('/announcements/reported', getAnunciosReportados);

/**
 * @openapi
 * /api/admin/announcements/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: RF-22 Gestionar anuncio reportado
 *     description: >
 *       **editar**: actualiza campos del anuncio y marca los reportes como revisados.
 *       Notifica al proveedor por WhatsApp.
 *
 *       **suspender**: cambia `estado` a `suspendido` y marca los reportes como revisados.
 *       Notifica al proveedor por WhatsApp.
 *
 *       **desestimar**: marca todos los reportes como `revisado: true` sin tomar acción
 *       sobre el anuncio. Sin notificación.
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
 *             required: [accion]
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [editar, suspender, desestimar]
 *               motivo:
 *                 type: string
 *                 description: Requerido para "editar" y "suspender"
 *                 example: Contenido que infringe las políticas de la plataforma.
 *               titulo:      { type: string }
 *               descripcion: { type: string }
 *               categoria:
 *                 type: string
 *                 enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *               precioRef:   { type: number }
 *     responses:
 *       200:
 *         description: Acción ejecutada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: object
 *                   properties:
 *                     anuncioId: { type: string }
 *                     estado:    { type: string }
 *       400:
 *         description: Acción inválida, motivo faltante o sin campos para editar.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Anuncio no encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/announcements/:id', gestionarAnuncioReportado);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: RF-19 Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema: { type: string, enum: [cliente, proveedor, admin] }
 *         description: Filtrar por rol
 *       - in: query
 *         name: activo
 *         schema: { type: boolean }
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Paginado' }
 */
router.get('/users', getUsuarios);

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: RF-19 Activar o desactivar usuario
 *     description: >
 *       Regla de negocio 5: el admin no puede desactivar otra cuenta de `admin`.
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
 *             required: [activo]
 *             properties:
 *               activo: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     usuarioId: { type: string }
 *                     activo:    { type: boolean }
 *       400:
 *         description: Campo "activo" no es booleano.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Intento de desactivar una cuenta de administrador.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/users/:id', toggleUsuario);

module.exports = router;
