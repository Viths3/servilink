const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const {
  getVerificaciones,
  procesarVerificacion,
  getUpgradeRequests,
  procesarUpgrade,
} = require('../controllers/adminController');

// Todos los endpoints /admin/* requieren JWT + rol admin
router.use(auth, role('admin'));

// RF-06 / RF-07: Verificaciones de proveedores
router.get('/verifications', getVerificaciones);
router.patch('/verifications/:id', procesarVerificacion);

// RF-17: Solicitudes de upgrade de rol
router.get('/upgrade-requests', getUpgradeRequests);
router.patch('/upgrade-requests/:id', procesarUpgrade);

module.exports = router;
