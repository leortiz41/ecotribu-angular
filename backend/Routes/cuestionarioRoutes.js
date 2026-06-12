const express = require('express');
const {
   crearCuestionario,
  obtenerCuestionarios,
  obtenerCuestionarioPorId,
  actualizarCuestionario,
  agregarPregunta,
  publicarCuestionario,
  cerrarCuestionario,
  desactivarCuestionario,
} = require('../Controllers/cuestionarioController');

const router = express.Router();

router.post('/', crearCuestionario);
router.get('/', obtenerCuestionarios);
router.get('/:id', obtenerCuestionarioPorId);
router.put('/:id', actualizarCuestionario);
router.post('/:id/preguntas', agregarPregunta);
router.post('/:id/publicar', publicarCuestionario);
router.post('/:id/cerrar', cerrarCuestionario);
router.delete('/:id', desactivarCuestionario);

module.exports = router;    