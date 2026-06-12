const express = require('express');
const {
  crearEvidencia,
  obtenerEvidencias,
  obtenerEvidenciaPorId,
  aprobarEvidencia,
  rechazarEvidencia,
  desactivarEvidencia,
} = require('../Controllers/evidenciaController');

const router = express.Router();

router.post('/', crearEvidencia);
router.get('/', obtenerEvidencias);
router.get('/:id', obtenerEvidenciaPorId);
router.patch('/:id/aprobar', aprobarEvidencia);
router.patch('/:id/rechazar', rechazarEvidencia);
router.delete('/:id', desactivarEvidencia);

module.exports = router;
