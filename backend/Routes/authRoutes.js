const express = require('express');
const { iniciarSesion } = require('../Controllers/authController');

const router = express.Router();

router.post('/login', iniciarSesion);

module.exports = router;
