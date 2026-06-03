const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const {
  enviarSolicitud,
  getSolicitudesEnviadas,
  getSolicitudesRecibidas,
  aceptarSolicitud,
  rechazarSolicitud,
  reagendarSolicitud,
  aceptarReagendamiento,
  rechazarReagendamiento,
} = require('../controllers/serviceRequestController');

// Todos los endpoints de solicitudes requieren JWT
router.use(auth);

router.post('/', enviarSolicitud);
router.get('/sent', getSolicitudesEnviadas);
router.get('/received', role('proveedor'), getSolicitudesRecibidas);

router.patch('/:id/accept', role('proveedor'), aceptarSolicitud);
router.patch('/:id/reject', role('proveedor'), rechazarSolicitud);
router.patch('/:id/reschedule', role('proveedor'), reagendarSolicitud);

router.patch('/:id/accept-reschedule', aceptarReagendamiento);
router.patch('/:id/reject-reschedule', rechazarReagendamiento);

module.exports = router;
