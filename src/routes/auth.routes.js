const express = require('express');
const router = express.Router();

const {
  registrarCliente,
  registrarProveedor,
  login,
  logout,
} = require('../controllers/authController');

const { uploadDocs, handleUploadError } = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Registro, login y logout de usuarios
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: RF-01 Registro de cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password, telefono]
 *             properties:
 *               nombre:   { type: string, example: María López }
 *               email:    { type: string, format: email, example: maria@example.com }
 *               password: { type: string, minLength: 8, example: password123 }
 *               telefono: { type: string, example: '+593991234567' }
 *     responses:
 *       201:
 *         description: Cuenta creada. Devuelve token JWT y datos del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:  { type: string }
 *                 token:    { type: string }
 *                 usuario:  { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Campos faltantes o formato inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: El correo ya está registrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register', registrarCliente);

/**
 * @openapi
 * /api/auth/register-provider:
 *   post:
 *     tags: [Auth]
 *     summary: RF-02 Registro de proveedor
 *     description: >
 *       Registra un proveedor con cédula ecuatoriana validada (módulo 10).
 *       Acepta hasta 2 documentos (JPG/PNG/PDF, máx 5 MB c/u).
 *       El `verificationStatus` queda en `pendiente` hasta que el admin apruebe.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nombre, email, password, telefono, cedula, categoria]
 *             properties:
 *               nombre:      { type: string, example: Carlos Pérez }
 *               email:       { type: string, format: email, example: carlos@example.com }
 *               password:    { type: string, minLength: 8, example: password123 }
 *               telefono:    { type: string, example: '+593987654321' }
 *               cedula:      { type: string, example: '0102030405' }
 *               categoria:
 *                 type: string
 *                 enum: [electricidad, plomeria, medicina, carpinteria, asesoria, otro]
 *               descripcion: { type: string, example: Electricista con 5 años de experiencia }
 *               documentos:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Proveedor registrado. Verificación pendiente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:  { type: string }
 *                 usuario:  { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Cédula inválida, campos faltantes o archivo no permitido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Correo o cédula ya registrada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/register-provider', uploadDocs, handleUploadError, registrarProveedor);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: RF-03 Login — obtener JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: maria@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Sesión iniciada. Incluye token JWT con vigencia de 7 días.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:  { type: string }
 *                 token:    { type: string, example: eyJhbGci... }
 *                 usuario:  { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Credenciales incorrectas o cuenta desactivada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: RF-04 Logout
 *     description: JWT es stateless. El servidor confirma la acción; el cliente debe descartar el token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje: { type: string, example: Sesión cerrada correctamente }
 *       401:
 *         description: Token no proporcionado o inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;
