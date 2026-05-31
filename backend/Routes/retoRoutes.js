const express = require('express');
const {
  crearReto,
  obtenerRetos,
  obtenerRetoPorId,
  actualizarReto,
  publicarReto,
  cerrarReto,
  desactivarReto,
} = require('../Controllers/retoController');

const router = express.Router();

router.post('/', crearReto);
router.get('/', obtenerRetos);
router.get('/:id', obtenerRetoPorId);
router.put('/:id', actualizarReto);
router.patch('/:id/publicar', publicarReto);
router.patch('/:id/cerrar', cerrarReto);
router.delete('/:id', desactivarReto);

module.exports = router;
