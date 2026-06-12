const express = require('express');
const {
  crearResultadoCuestionario,
  obtenerResultadosCuestionario,
  obtenerResultadoCuestionarioPorId,
  actualizarResultadoCuestionario,
  desactivarResultadoCuestionario,
} = require('../Controllers/resultadoCuestionarioController');

const router = express.Router();

router.post('/', crearResultadoCuestionario);
router.get('/', obtenerResultadosCuestionario);
router.get('/:id', obtenerResultadoCuestionarioPorId);
router.put('/:id', actualizarResultadoCuestionario);
router.delete('/:id', desactivarResultadoCuestionario);

module.exports = router;