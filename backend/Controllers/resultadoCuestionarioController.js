const mongoose = require('mongoose');
const ResultadoCuestionario = require('../Model/resultadoCuestionarioModel');
const Cuestionario = require('../Model/cuestionarioModel');
const Usuario = require('../Model/usuarioModel');
const Escuela = require('../Model/escuelaModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un resultado para ese cuestionario, alumno e intento.',
  validationMessage: 'Datos invalidos para el resultado de cuestionario.',
});

const llenarResultadoCuestionario = (query) => {
  return query
    .populate('cuestionario', 'titulo modalidad estado')
    .populate('alumno', 'nombre email rol escuela')
    .populate('escuela', 'nombre codigo');
};

const crearResultadoCuestionario = async (req, res) => {
  try {
    const { cuestionario, alumno, escuela, puntajeObtenido, puntajeMaximo } = req.body;

    if (!cuestionario || !alumno || !escuela || puntajeObtenido === undefined || puntajeMaximo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'cuestionario, alumno, escuela, puntajeObtenido y puntajeMaximo son obligatorios.',
      });
    }

    if (!isValidObjectId(cuestionario) || !isValidObjectId(alumno) || !isValidObjectId(escuela)) {
      return res.status(400).json({
        success: false,
        message: 'cuestionario, alumno o escuela tienen formato de id invalido.',
      });
    }

    const [cuestionarioValido, alumnoValido, escuelaValida] = await Promise.all([
      Cuestionario.findOne({ _id: cuestionario, activo: true }).select('escuela estado titulo'),
      Usuario.findOne({ _id: alumno, activo: true }).select('rol escuela puntos'),
      Escuela.findOne({ _id: escuela, activa: true }).select('nombre'),
    ]);

    if (!cuestionarioValido) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado o inactivo.',
      });
    }

    if (!alumnoValido) {
      return res.status(404).json({
        success: false,
        message: 'Alumno no encontrado o inactivo.',
      });
    }

    if (alumnoValido.rol !== 'alumno') {
      return res.status(403).json({
        success: false,
        message: 'Solo usuarios con rol alumno pueden registrar resultados.',
      });
    }

    if (!escuelaValida) {
      return res.status(404).json({
        success: false,
        message: 'Escuela no encontrada o inactiva.',
      });
    }

    if (String(cuestionarioValido.escuela) !== String(escuela) || String(alumnoValido.escuela) !== String(escuela)) {
      return res.status(400).json({
        success: false,
        message: 'El cuestionario, alumno y escuela deben pertenecer a la misma escuela.',
      });
    }

    if (cuestionarioValido.estado !== 'publicado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden registrar resultados de cuestionarios publicados.',
      });
    }

    const puntajeNumerico = Number(puntajeObtenido);
    const maximoNumerico = Number(puntajeMaximo);

    if (Number.isNaN(puntajeNumerico) || Number.isNaN(maximoNumerico) || puntajeNumerico < 0 || maximoNumerico < 0) {
      return res.status(400).json({
        success: false,
        message: 'puntajeObtenido y puntajeMaximo deben ser numeros validos mayores o iguales a cero.',
      });
    }

    if (puntajeNumerico > maximoNumerico) {
      return res.status(400).json({
        success: false,
        message: 'puntajeObtenido no puede ser mayor que puntajeMaximo.',
      });
    }

    const mejorResultadoPrevio = await ResultadoCuestionario.findOne({
      cuestionario,
      alumno,
      activo: true,
    })
      .sort({ puntajeObtenido: -1 })
      .select('puntajeObtenido');

    const resultado = await ResultadoCuestionario.create({
      ...req.body,
      puntajeObtenido: puntajeNumerico,
      puntajeMaximo: maximoNumerico,
      respuestas: Array.isArray(req.body.respuestas) ? req.body.respuestas : [],
    });

    const mejorPrevio = Number(mejorResultadoPrevio?.puntajeObtenido ?? 0);
    const puntosNuevos = Math.max(0, puntajeNumerico - mejorPrevio);

    if (puntosNuevos > 0) {
      await Usuario.findByIdAndUpdate(alumno, { $inc: { puntos: puntosNuevos } }, { new: true, runValidators: true });
    }

    const data = await llenarResultadoCuestionario(ResultadoCuestionario.findById(resultado._id));

    return res.status(201).json({
      success: true,
      message: `Resultado de cuestionario creado correctamente. Puntos sumados: ${puntosNuevos}.`,
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerResultadosCuestionario = async (req, res) => {
  try {
    const filtro = req.query.incluirInactivos === 'true' ? {} : { activo: true };

    if (req.query.cuestionario) {
      if (!isValidObjectId(req.query.cuestionario)) {
        return res.status(400).json({
          success: false,
          message: 'El id de cuestionario en el filtro no es valido.',
        });
      }

      filtro.cuestionario = req.query.cuestionario;
    }

    if (req.query.alumno) {
      if (!isValidObjectId(req.query.alumno)) {
        return res.status(400).json({
          success: false,
          message: 'El id de alumno en el filtro no es valido.',
        });
      }

      filtro.alumno = req.query.alumno;
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

    if (req.query.aprobado === 'true') {
      filtro.aprobado = true;
    }

    if (req.query.aprobado === 'false') {
      filtro.aprobado = false;
    }

    if (req.query.intento) {
      const intento = Number(req.query.intento);

      if (Number.isNaN(intento) || intento < 1) {
        return res.status(400).json({
          success: false,
          message: 'El intento en el filtro no es valido.',
        });
      }

      filtro.intento = intento;
    }

    const data = await llenarResultadoCuestionario(
      ResultadoCuestionario.find(filtro).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      message: 'Resultados de cuestionarios obtenidos correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerResultadoCuestionarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del resultado no es valido.',
      });
    }

    const data = await llenarResultadoCuestionario(ResultadoCuestionario.findById(id));

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Resultado de cuestionario no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resultado de cuestionario obtenido correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const actualizarResultadoCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del resultado no es valido.',
      });
    }

    const camposPermitidos = [
      'cuestionario',
      'alumno',
      'escuela',
      'respuestas',
      'puntajeObtenido',
      'puntajeMaximo',
      'aprobado',
      'intento',
      'activo',
    ];

    const camposRecibidos = Object.keys(req.body);

    if (camposRecibidos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron datos para actualizar el resultado.',
      });
    }

    const hayCampoInvalido = camposRecibidos.some((campo) => !camposPermitidos.includes(campo));

    if (hayCampoInvalido) {
      return res.status(400).json({
        success: false,
        message: 'Se recibieron campos no permitidos para actualizar el resultado.',
      });
    }

    const resultado = await ResultadoCuestionario.findById(id);

    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Resultado de cuestionario no encontrado para actualizar.',
      });
    }

    camposRecibidos.forEach((campo) => {
      resultado[campo] = req.body[campo];
    });

    await resultado.save();

    const data = await llenarResultadoCuestionario(ResultadoCuestionario.findById(resultado._id));

    return res.status(200).json({
      success: true,
      message: 'Resultado de cuestionario actualizado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarResultadoCuestionario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del resultado no es valido.',
      });
    }

    const data = await llenarResultadoCuestionario(
      ResultadoCuestionario.findByIdAndUpdate(
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
        message: 'Resultado de cuestionario no encontrado para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resultado de cuestionario desactivado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearResultadoCuestionario,
  obtenerResultadosCuestionario,
  obtenerResultadoCuestionarioPorId,
  actualizarResultadoCuestionario,
  desactivarResultadoCuestionario,
};
