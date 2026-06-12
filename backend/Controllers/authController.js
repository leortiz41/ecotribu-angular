const Usuario = require('../Model/usuarioModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un registro duplicado.',
  validationMessage: 'Datos invalidos en la solicitud.',
});

const sanitizarUsuario = (usuario) => {
  const usuarioLimpio = usuario.toObject();
  delete usuarioLimpio.password;
  return usuarioLimpio;
};

const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son obligatorios.',
      });
    }

    const usuario = await Usuario.findOne({ email: String(email).toLowerCase().trim() })
      .select('+password')
      .populate('escuela', 'nombre codigo');

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    const passwordValido = await usuario.comparePassword(password);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login exitoso.',
      data: sanitizarUsuario(usuario),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  iniciarSesion,
};
