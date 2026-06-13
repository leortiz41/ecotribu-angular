const mongoose = require('mongoose');
const Usuario = require('../Model/usuarioModel');
const Escuela = require('../Model/escuelaModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeUsuario = (usuario) => {
  const usuarioLimpio = usuario.toObject();
  delete usuarioLimpio.password;
  return usuarioLimpio;
};

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un usuario con ese email.',
  validationMessage: 'Datos invalidos para el usuario.',
});

const validarEscuela = async (escuelaId, res) => {
  if (!isValidObjectId(escuelaId)) {
    res.status(400).json({
      success: false,
      message: 'El id de escuela no es valido.',
    });
    return false;
  }

  const escuela = await Escuela.findOne({ _id: escuelaId, activa: true });

  if (!escuela) {
    res.status(404).json({
      success: false,
      message: 'Escuela no encontrada o inactiva.',
    });
    return false;
  }

  return true;
};

const crearUsuario = async (req, res) => {
  try {
    const { escuela } = req.body;

    const escuelaValida = await validarEscuela(escuela, res);
    if (!escuelaValida) {
      return;
    }

    const usuario = await Usuario.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente.',
      data: sanitizeUsuario(usuario),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };

    if (req.query.rol) {
      filtro.rol = req.query.rol;
    }

    if (req.query.escuela) {
      if (!isValidObjectId(req.query.escuela)) {
        return res.status(400).json({
          success: false,
          message: 'El id de escuela en el filtro no es valido.',
        });
      }

      filtro.escuela = req.query.escuela;
    }

    if (req.query.grado) {
      filtro.grado = String(req.query.grado).trim();
    }

    const usuarios = await Usuario.find(filtro)
      .populate('escuela', 'nombre codigo')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos correctamente.',
      data: usuarios.map((usuario) => sanitizeUsuario(usuario)),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del usuario no es valido.',
      });
    }

    const usuario = await Usuario.findById(id).populate('escuela', 'nombre codigo');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario obtenido correctamente.',
      data: sanitizeUsuario(usuario),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del usuario no es valido.',
      });
    }

    const camposPermitidos = ['nombre', 'email', 'password', 'rol', 'escuela', 'grado', 'puntos', 'activo'];
    const camposRecibidos = Object.keys(req.body);
    const hayCampoInvalido = camposRecibidos.some((campo) => !camposPermitidos.includes(campo));

    if (hayCampoInvalido) {
      return res.status(400).json({
        success: false,
        message: 'Se recibieron campos no permitidos para actualizar el usuario.',
      });
    }

    if (req.body.escuela) {
      const escuelaValida = await validarEscuela(req.body.escuela, res);
      if (!escuelaValida) {
        return;
      }
    }

    const usuario = await Usuario.findById(id).select('+password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para actualizar.',
      });
    }

    camposRecibidos.forEach((campo) => {
      usuario[campo] = req.body[campo];
    });

    await usuario.save();

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente.',
      data: sanitizeUsuario(usuario),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del usuario no es valido.',
      });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { activo: false },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario desactivado correctamente.',
      data: sanitizeUsuario(usuario),
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario,
};
