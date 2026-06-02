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

// RF-01: Registro de cliente
router.post('/register', registrarCliente);

// RF-02: Registro de proveedor (con documentos)
router.post('/register-provider', uploadDocs, handleUploadError, registrarProveedor);

// RF-03: Login
router.post('/login', login);

// RF-04: Logout (requiere estar autenticado)
router.post('/logout', authMiddleware, logout);

module.exports = router;
