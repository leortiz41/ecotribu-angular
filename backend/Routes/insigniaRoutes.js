const express = require('express');
const {
  crearRanking,
  obtenerRankings,
  obtenerRankingPorId,
  actualizarRanking,
  desactivarRanking,
  recalcularRankingGeneral,
  recalcularRankingEscuela,
} = require('../Controllers/rankingController');

const router = express.Router();

router.post('/', crearRanking);
router.get('/', obtenerRankings);
router.get('/:id', obtenerRankingPorId);
router.put('/:id', actualizarRanking);
router.delete('/:id', desactivarRanking);
router.post('/recalcular/general', recalcularRankingGeneral);
router.post('/recalcular/escuela/:escuelaId', recalcularRankingEscuela);

module.exports = router;    