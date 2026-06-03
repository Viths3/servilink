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

// Endpoints públicos (sin auth)
router.get('/', listarAnuncios);
router.get('/:id', obtenerAnuncio);

// Endpoints protegidos
router.post('/', auth, crearAnuncio);
router.patch('/:id', auth, editarAnuncio);
router.delete('/:id', auth, desactivarAnuncio);
router.post('/:id/report', auth, reportarAnuncio);

module.exports = router;
