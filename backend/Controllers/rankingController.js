const mongoose = require('mongoose');
const Ranking = require('../Model/rankingModel');
const Usuario = require('../Model/usuarioModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un registro de ranking con esos datos.',
  validationMessage: 'Datos invalidos para el ranking.',
});

const llenarRanking = (query) => {
  return query
    .populate('alumno', 'nombre email rol puntos escuela')
    .populate('escuela', 'nombre codigo');
};

const crearRanking = async (req, res) => {
  try {
    const { alumno, puntos, posicion } = req.body;

    if (!alumno || puntos === undefined || posicion === undefined) {
      return res.status(400).json({
        success: false,
        message: 'alumno, puntos y posicion son obligatorios.',
      });
    }

    const ranking = await Ranking.create({
      ...req.body,
      tipo: req.body.tipo || 'general',
      periodo: req.body.periodo || 'general',
    });

    const data = await llenarRanking(Ranking.findById(ranking._id));

    return res.status(201).json({
      success: true,
      message: 'Ranking creado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerRankings = async (req, res) => {
  try {
    const filtro = req.query.incluirInactivos === 'true' ? {} : { activo: true };

    if (req.query.tipo) {
      filtro.tipo = req.query.tipo;
    }

    if (req.query.periodo) {
      filtro.periodo = String(req.query.periodo).trim();
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

    const data = await llenarRanking(Ranking.find(filtro).sort({ posicion: 1, puntos: -1 }));

    return res.status(200).json({
      success: true,
      message: 'Rankings obtenidos correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerRankingPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del ranking no es valido.',
      });
    }

    const data = await llenarRanking(Ranking.findById(id));

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Ranking no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ranking obtenido correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const actualizarRanking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del ranking no es valido.',
      });
    }

    const data = await llenarRanking(
      Ranking.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Ranking no encontrado para actualizar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ranking actualizado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarRanking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del ranking no es valido.',
      });
    }

    const data = await llenarRanking(
      Ranking.findByIdAndUpdate(
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
        message: 'Ranking no encontrado para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ranking desactivado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const recalcularRankingGeneral = async (req, res) => {
  try {
    const periodo = req.body.periodo ? String(req.body.periodo).trim() : 'general';

    const alumnos = await Usuario.find({ activo: true, rol: 'alumno' })
      .select('escuela puntos createdAt')
      .sort({ puntos: -1, createdAt: 1 });

    await Ranking.deleteMany({ tipo: 'general', periodo });

    if (alumnos.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay alumnos para recalcular el ranking general.',
        data: [],
      });
    }

    const fechaCalculo = new Date();

    const registros = alumnos.map((alumno, index) => {
      return {
        alumno: alumno._id,
        escuela: alumno.escuela,
        tipo: 'general',
        periodo,
        puntos: alumno.puntos || 0,
        posicion: index + 1,
        fechaCalculo,
        activo: true,
      };
    });

    await Ranking.insertMany(registros);

    const data = await llenarRanking(
      Ranking.find({ tipo: 'general', periodo, activo: true }).sort({ posicion: 1 })
    );

    return res.status(200).json({
      success: true,
      message: 'Ranking general recalculado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const recalcularRankingEscuela = async (req, res) => {
  try {
    const escuelaId = req.body.escuela || req.params.escuelaId;
    const periodo = req.body.periodo ? String(req.body.periodo).trim() : 'general';

    if (!escuelaId || !isValidObjectId(escuelaId)) {
      return res.status(400).json({
        success: false,
        message: 'El id de escuela para recalcular ranking no es valido.',
      });
    }

    const alumnos = await Usuario.find({ activo: true, rol: 'alumno', escuela: escuelaId })
      .select('escuela puntos createdAt')
      .sort({ puntos: -1, createdAt: 1 });

    await Ranking.deleteMany({ tipo: 'escuela', periodo, escuela: escuelaId });

    if (alumnos.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay alumnos para recalcular el ranking de la escuela.',
        data: [],
      });
    }

    const fechaCalculo = new Date();

    const registros = alumnos.map((alumno, index) => {
      return {
        alumno: alumno._id,
        escuela: escuelaId,
        tipo: 'escuela',
        periodo,
        puntos: alumno.puntos || 0,
        posicion: index + 1,
        fechaCalculo,
        activo: true,
      };
    });

    await Ranking.insertMany(registros);

    const data = await llenarRanking(
      Ranking.find({ tipo: 'escuela', periodo, escuela: escuelaId, activo: true }).sort({ posicion: 1 })
    );

    return res.status(200).json({
      success: true,
      message: 'Ranking por escuela recalculado correctamente.',
      data,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearRanking,
  obtenerRankings,
  obtenerRankingPorId,
  actualizarRanking,
  desactivarRanking,
  recalcularRankingGeneral,
  recalcularRankingEscuela,
};
