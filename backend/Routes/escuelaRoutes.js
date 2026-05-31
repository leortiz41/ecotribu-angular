const express = require('express');
const {
  crearEscuela,
  obtenerEscuelas,
  obtenerEscuelaPorId,
  actualizarEscuela,
  desactivarEscuela,
} = require('../Controllers/escuelaController');

const router = express.Router();

router.post('/', crearEscuela);
router.get('/', obtenerEscuelas);
router.get('/:id', obtenerEscuelaPorId);
router.put('/:id', actualizarEscuela);
router.delete('/:id', desactivarEscuela);

module.exports = router;
