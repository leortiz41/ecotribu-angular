const mongoose = require('mongoose');
const Escuela = require('../Model/escuelaModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

// Funciones para validación y manejo de errores
const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe una escuela con ese codigo.',
  validationMessage: 'Datos invalidos para la escuela.',
});

// Validación de ObjectId de Mongoose para asegurar que los IDs proporcionados sean válidos
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);



// Controladores para las operaciones CRUD de la escuela

//crear
const crearEscuela = async (req, res) => {
  try {
    const escuela = await Escuela.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Escuela creada correctamente.',
      data: escuela,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};


// El objetivo de este controlador es crear una nueva escuela 
// en la base de datos utilizando los datos proporcionados en el 
// cuerpo de la solicitud. Si la creación es exitosa, devuelve un
//  mensaje de éxito junto con los datos de la escuela creada.
//  Si ocurre un error, se maneja utilizando la 
// funcion manejarErrorMongoose para proporcionar una respuesta adecuada al cliente.

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
    return manejarErrorMongoose(error, res);
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
    return manejarErrorMongoose(error, res);
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
    return manejarErrorMongoose(error, res);
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
    return manejarErrorMongoose(error, res);
  }
};


module.exports = {
  crearEscuela,
  obtenerEscuelas,
  obtenerEscuelaPorId,
  actualizarEscuela,
  desactivarEscuela,
};
