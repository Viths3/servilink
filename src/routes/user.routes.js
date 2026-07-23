const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { uploadDocs, uploadFoto, handleUploadError } = require('../middlewares/upload.middleware');
const { getMe, updateMe, subirDocumentos, getPerfilPublico } = require('../controllers/userController');
const { getResenasProveedor } = require('../controllers/reviewController');

/**
 * @openapi
 * tags:
 *   name: Usuarios
 *   description: Perfil propio, carga de documentos y perfil público
 */

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener perfil propio
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos completos del usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Token no proporcionado o inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/me', auth, getMe);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualizar perfil propio
 *     description: Solo se pueden modificar `nombre` y `telefono`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:   { type: string, example: María López Actualizado }
 *               telefono: { type: string, example: '+593991234999' }
 *     responses:
 *       200:
 *         description: Perfil actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Formato de teléfono inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Token no proporcionado o inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/me', auth, uploadFoto, handleUploadError, updateMe);

/**
 * @openapi
 * /api/users/upload-docs:
 *   post:
 *     tags: [Usuarios]
 *     summary: RF-05 Subir documentos de verificación
 *     description: >
 *       Solo disponible para usuarios con rol `proveedor`.
 *       Sube hasta 2 archivos (JPG/PNG/PDF, máx 5 MB c/u) y cambia
 *       `verificationStatus` a `pendiente`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [documentos]
 *             properties:
 *               documentos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Documentos cargados. Verificación en proceso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:            { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     documentos:         { type: array, items: { type: string } }
 *                     verificationStatus: { type: string, example: pendiente }
 *       400:
 *         description: Ningún archivo enviado o tipo no permitido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: El usuario no tiene rol de proveedor.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/upload-docs', auth, uploadDocs, handleUploadError, subirDocumentos);

/**
 * @openapi
 * /api/users/{id}/public:
 *   get:
 *     tags: [Usuarios]
 *     summary: Ver perfil público de un usuario
 *     description: No requiere autenticación. Solo expone campos públicos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID de MongoDB del usuario
 *     responses:
 *       200:
 *         description: Perfil público del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *       404:
 *         description: Usuario no encontrado o inactivo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id/public', getPerfilPublico);

/**
 * @openapi
 * /api/users/{id}/reviews:
 *   get:
 *     tags: [Usuarios]
 *     summary: Ver reseñas y calificación promedio de un proveedor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de reseñas, total y promedio.
 */
router.get('/:id/reviews', getResenasProveedor);

module.exports = router;
