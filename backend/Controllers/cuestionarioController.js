const mongoose = require('mongoose');
const Cuestionario = require('../Model/cuestionarioModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un cuestionario con un valor unico duplicado.',
  validationMessage: 'Datos invalidos para el cuestionario.',
});

const llenarCuestionario = (query) => {
  return query
    .populate('escuela', 'nombre codigo')
    .populate('creador', 'nombre email rol escuela');
};

const crearCuestionario = async (req, res) => {
  try {
    const { titulo, escuela, creador } = req.body;

    if (!titulo || !escuela || !creador) {
      return res.status(400).json({
        success: false,
        message: 'titulo, escuela y creador son obligatorios.',
      });
    }

    const cuestionario = await Cuestionario.create({
      ...req.body,
      modalidad: req.body.modalidad || 'mixto',
      preguntas: Array.isArray(req.body.preguntas) ? req.body.preguntas : [],
    });

    const data = await llenarCuestionario(Cuestionario.findById(cuestionario._id));

    return res.status(201).json({
      success: true,
      message: 'Cuestionario creado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerCuestionarios = async (req, res) => {
  try {
    const filtro = req.query.incluirInactivos === 'true' ? {} : { activo: true };

    if (req.query.estado) {
      filtro.estado = req.query.estado;
    }

    if (req.query.modalidad) {
      filtro.modalidad = req.query.modalidad;
    }

    if (req.query.escuela) {
      filtro.escuela = req.query.escuela;
    }

    if (req.query.creador) {
      filtro.creador = req.query.creador;
    }

    if (req.query.grado) {
      const grado = String(req.query.grado).trim();
      filtro.$or = [{ grado }, { grado: { $exists: false } }, { grado: '' }, { grado: null }];
    }

    const data = await llenarCuestionario(Cuestionario.find(filtro).sort({ createdAt: -1 }));

    return res.status(200).json({
      success: true,
      message: 'Cuestionarios obtenidos correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerCuestionarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const data = await llenarCuestionario(Cuestionario.findById(id));

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cuestionario obtenido correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const actualizarCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const data = await llenarCuestionario(
      Cuestionario.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado para actualizar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cuestionario actualizado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const agregarPregunta = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const cuestionario = await Cuestionario.findById(id);

    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado para agregar pregunta.',
      });
    }

    const pregunta = req.body && req.body.pregunta ? req.body.pregunta : req.body;

    if (!pregunta || typeof pregunta !== 'object' || Array.isArray(pregunta)) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar una pregunta valida en el cuerpo de la solicitud.',
      });
    }

    if (!Array.isArray(cuestionario.preguntas)) {
      cuestionario.preguntas = [];
    }

    cuestionario.preguntas.push(pregunta);
    await cuestionario.save();

    const data = await llenarCuestionario(Cuestionario.findById(cuestionario._id));

    return res.status(200).json({
      success: true,
      message: 'Pregunta agregada correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const publicarCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const cuestionario = await Cuestionario.findById(id);

    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado para publicar.',
      });
    }

    cuestionario.estado = 'publicado';
    cuestionario.activo = true;
    await cuestionario.save();

    const data = await llenarCuestionario(Cuestionario.findById(cuestionario._id));

    return res.status(200).json({
      success: true,
      message: 'Cuestionario publicado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const cerrarCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const cuestionario = await Cuestionario.findById(id);

    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado para cerrar.',
      });
    }

    cuestionario.estado = 'cerrado';
    cuestionario.activo = false;
    await cuestionario.save();

    const data = await llenarCuestionario(Cuestionario.findById(cuestionario._id));

    return res.status(200).json({
      success: true,
      message: 'Cuestionario cerrado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del cuestionario no es valido.',
      });
    }

    const data = await llenarCuestionario(
      Cuestionario.findByIdAndUpdate(
        id,
        { activo: false },
        {
          new: true,
          runValidators: true,
        }
      )
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cuestionario desactivado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearCuestionario,
  obtenerCuestionarios,
  obtenerCuestionarioPorId,
  actualizarCuestionario,
  agregarPregunta,
  publicarCuestionario,
  cerrarCuestionario,
  desactivarCuestionario,
};
