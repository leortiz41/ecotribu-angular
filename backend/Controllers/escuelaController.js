const mongoose = require('mongoose');
const Escuela = require('../Model/escuelaModel');

const handleMongooseError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Ya existe una escuela con ese codigo.',
      error: error.message,
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos invalidos para la escuela.',
      error: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    error: error.message,
  });
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const crearEscuela = async (req, res) => {
  try {
    const escuela = await Escuela.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Escuela creada correctamente.',
      data: escuela,
    });
  } catch (error) {
    return handleMongooseError(error, res);
  }
};

const obtenerEscuelas = async (req, res) => {
  try {
    const incluirInactivas = req.query.incluirInactivas === 'true';
    const filtro = incluirInactivas ? {} : { activa: true };

    const escuelas = await Escuela.find(filtro).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Escuelas obtenidas correctamente.',
      data: escuelas,
    });
  } catch (error) {
    return handleMongooseError(error, res);
  }
};

const obtenerEscuelaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la escuela no es valido.',
      });
    }

    const escuela = await Escuela.findById(id);

    if (!escuela) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Escuela obtenida correctamente.',
      data: escuela,
    });
  } catch (error) {
    return handleMongooseError(error, res);
  }
};

const actualizarEscuela = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la escuela no es valido.',
      });
    }

    const escuela = await Escuela.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!escuela) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada para actualizar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Escuela actualizada correctamente.',
      data: escuela,
    });
  } catch (error) {
    return handleMongooseError(error, res);
  }
};

const desactivarEscuela = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la escuela no es valido.',
      });
    }

    const escuela = await Escuela.findByIdAndUpdate(
      id,
      { activa: false },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!escuela) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Escuela desactivada correctamente.',
      data: escuela,
    });
  } catch (error) {
    return handleMongooseError(error, res);
  }
};

module.exports = {
  crearEscuela,
  obtenerEscuelas,
  obtenerEscuelaPorId,
  actualizarEscuela,
  desactivarEscuela,
};
