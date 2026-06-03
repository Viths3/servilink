const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const {
  listarAnuncios,
  obtenerAnuncio,
  crearAnuncio,
  editarAnuncio,
  desactivarAnuncio,
  reportarAnuncio,
} = require('../controllers/announcementController');

/**
 * @openapi
 * tags:
 *   name: Anuncios
 *   description: CRUD de anuncios de servicios y sistema de reportes
 */

/**
 * @openapi
 * /api/announcements:
 *   get:
 *     tags: [Anuncios]
 *     summary: RF-08 / RF-20 Listar anuncios (público)
 *     description: >
 *       Devuelve únicamente anuncios con `estado: activo`.
 *       Soporta filtro por categoría y búsqueda de texto en título y descripción.
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Búsqueda libre en título y descripción (case-insensitive)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200:
 *         description: Lista paginada de anuncios activos.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Paginado' }
 *       400:
 *         description: Categoría inválida.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', listarAnuncios);

/**
 * @openapi
 * /api/announcements/{id}:
 *   get:
 *     tags: [Anuncios]
 *     summary: RF-08 Obtener anuncio por ID (público)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalle del anuncio con datos del proveedor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Announcement' }
 *       404:
 *         description: Anuncio no encontrado o no está activo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', obtenerAnuncio);

/**
 * @openapi
 * /api/announcements:
 *   post:
 *     tags: [Anuncios]
 *     summary: RF-09 Crear anuncio
 *     description: >
 *       Requiere rol `proveedor` con `verificationStatus: aprobado`.
 *       Un proveedor puede tener múltiples anuncios activos.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, descripcion, categoria]
 *             properties:
 *               titulo:      { type: string, example: Instalación eléctrica residencial }
 *               descripcion: { type: string, example: Realizo instalaciones con garantía de 1 año. }
 *               categoria:
 *                 type: string
 *                 enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *               precioRef:   { type: number, example: 80 }
 *     responses:
 *       201:
 *         description: Anuncio publicado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/Announcement' }
 *       400:
 *         description: Campos requeridos faltantes.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: No es proveedor o no está verificado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', auth, crearAnuncio);

/**
 * @openapi
 * /api/announcements/{id}:
 *   patch:
 *     tags: [Anuncios]
 *     summary: RF-10 Editar anuncio
 *     description: Solo el dueño del anuncio puede editarlo. Los anuncios suspendidos no son editables.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:      { type: string }
 *               descripcion: { type: string }
 *               categoria:
 *                 type: string
 *                 enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *               precioRef:   { type: number }
 *     responses:
 *       200:
 *         description: Anuncio actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/Announcement' }
 *       403:
 *         description: No es el dueño o el anuncio está suspendido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Anuncio no encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.patch('/:id', auth, editarAnuncio);

/**
 * @openapi
 * /api/announcements/{id}:
 *   delete:
 *     tags: [Anuncios]
 *     summary: RF-11 Desactivar anuncio (soft-delete)
 *     description: Cambia el estado a `inactivo`. Solo el dueño del anuncio puede hacerlo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Anuncio desactivado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *       403:
 *         description: No es el dueño del anuncio.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Anuncio no encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: El anuncio ya está inactivo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', auth, desactivarAnuncio);

/**
 * @openapi
 * /api/announcements/{id}/report:
 *   post:
 *     tags: [Anuncios]
 *     summary: RF-21 Reportar anuncio
 *     description: >
 *       El dueño del anuncio no puede reportarlo. Un usuario no puede
 *       reportar el mismo anuncio más de una vez.
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
 *               motivo:
 *                 type: string
 *                 enum: [contenido_inapropiado, informacion_falsa, spam, otro]
 *               descripcion:
 *                 type: string
 *                 example: El precio indicado no corresponde al servicio.
 *     responses:
 *       201:
 *         description: Reporte enviado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *       403:
 *         description: El usuario es el dueño del anuncio.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Anuncio no encontrado o no está activo.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Ya reportaste este anuncio.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:id/report', auth, reportarAnuncio);

module.exports = router;
