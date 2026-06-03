const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { uploadDocs, handleUploadError } = require('../middlewares/upload.middleware');
const { solicitarUpgrade, getMiSolicitud } = require('../controllers/upgradeController');

// RF-16: Solicitar upgrade de cliente a proveedor (acepta documentos opcionales)
router.post('/', auth, role('cliente'), uploadDocs, handleUploadError, solicitarUpgrade);

// Ver mi última solicitud
router.get('/me', auth, getMiSolicitud);

module.exports = router;
