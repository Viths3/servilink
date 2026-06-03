const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { uploadDocs, uploadFoto, handleUploadError } = require('../middlewares/upload.middleware');
const { getMe, updateMe, subirDocumentos, getPerfilPublico } = require('../controllers/userController');

// Perfil propio
router.get('/me', auth, getMe);
router.patch('/me', auth, updateMe);

// RF-05: Carga de documentos de verificación (solo proveedores)
router.post('/upload-docs', auth, uploadDocs, handleUploadError, subirDocumentos);

// Perfil público (sin auth)
router.get('/:id/public', getPerfilPublico);

module.exports = router;
