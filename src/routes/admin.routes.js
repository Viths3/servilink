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

// Todos los endpoints /admin/* requieren JWT + rol admin
router.use(auth, role('admin'));

// RF-18: Métricas del dashboard
router.get('/stats', getStats);

// RF-06 / RF-07: Verificaciones de proveedores
router.get('/verifications', getVerificaciones);
router.patch('/verifications/:id', procesarVerificacion);

// RF-17: Solicitudes de upgrade de rol
router.get('/upgrade-requests', getUpgradeRequests);
router.patch('/upgrade-requests/:id', procesarUpgrade);

// RF-22: Anuncios reportados — debe ir ANTES de /:id para no ser capturado por el param
router.get('/announcements/reported', getAnunciosReportados);
router.patch('/announcements/:id', gestionarAnuncioReportado);

// RF-19: Gestión de usuarios
router.get('/users', getUsuarios);
router.patch('/users/:id', toggleUsuario);

module.exports = router;
