const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { uploadDocs, handleUploadError, verificarDocumentos } = require('../middlewares/upload.middleware');
const { solicitarUpgrade, getMiSolicitud } = require('../controllers/upgradeController');

/**
 * @openapi
 * tags:
 *   name: Upgrade de rol
 *   description: Solicitudes de clientes para convertirse en proveedores (RF-16)
 */

/**
 * @openapi
 * /api/upgrade-requests:
 *   post:
 *     tags: [Upgrade de rol]
 *     summary: RF-16 Solicitar upgrade a proveedor
 *     description: >
 *       Solo para usuarios con rol `cliente`. Valida la cédula ecuatoriana
 *       con el algoritmo módulo 10. Solo puede existir una solicitud en estado
 *       `pendiente` por usuario al mismo tiempo. Acepta documentos opcionales
 *       (JPG/PNG/PDF, máx 5 MB c/u).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [cedula, categoria]
 *             properties:
 *               cedula:      { type: string, example: '0102030405' }
 *               categoria:
 *                 type: string
 *                 enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *               descripcion: { type: string, example: Plomero con 8 años de experiencia }
 *               documentos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Solicitud enviada. Pendiente de revisión por el admin.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string }
 *                 data:    { $ref: '#/components/schemas/UpgradeRequest' }
 *       400:
 *         description: Cédula inválida o campos faltantes.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: El usuario no tiene rol cliente.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Ya es proveedor, cédula en uso, o ya tiene una solicitud pendiente.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', auth, role('cliente'), uploadDocs, handleUploadError, verificarDocumentos, solicitarUpgrade);

/**
 * @openapi
 * /api/upgrade-requests/me:
 *   get:
 *     tags: [Upgrade de rol]
 *     summary: Ver mi última solicitud de upgrade
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Última solicitud de upgrade del usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/UpgradeRequest' }
 *       404:
 *         description: No tiene solicitudes registradas.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/me', auth, getMiSolicitud);

module.exports = router;
