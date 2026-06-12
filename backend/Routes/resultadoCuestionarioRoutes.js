const express = require('express');
const {
  crearCuestionario,
  obtenerCuestionarios,
  obtenerCuestionarioPorId,
  actualizarCuestionario,
  desactivarCuestionario,
} = require('../Controllers/cuestionarioController');

const router = express.Router();

router.post('/', crearCuestionario);
router.get('/', obtenerCuestionarios);
router.get('/:id', obtenerCuestionarioPorId);
router.put('/:id', actualizarCuestionario);
router.delete('/:id', desactivarCuestionario);

module.exports = router;