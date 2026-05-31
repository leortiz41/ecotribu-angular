const express = require('express');
const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario,
} = require('../Controllers/usuarioController');

const router = express.Router();

router.post('/', crearUsuario);
router.get('/', obtenerUsuarios);
router.get('/:id', obtenerUsuarioPorId);
router.put('/:id', actualizarUsuario);
router.delete('/:id', desactivarUsuario);

module.exports = router;
