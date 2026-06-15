const mongoose = require('mongoose');
const Evidencia = require('../Model/evidenciaModel');
const Reto = require('../Model/retoModel');
const Usuario = require('../Model/usuarioModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const estadosPermitidos = ['pendiente', 'aprobada', 'rechazada'];
const rolesRevisorPermitidos = ['profesor', 'administrador', 'admin'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe una evidencia activa para este reto y alumno.',
  validationMessage: 'Datos invalidos para la evidencia.',
});

const validarReto = async (retoId, res, options = {}) => {
  const { debeEstarPublicado = false } = options;

  if (!isValidObjectId(retoId)) {
    res.status(400).json({
      success: false,
      message: 'El id del reto no es valido.',
    });
    return null;
  }

  const reto = await Reto.findOne({ _id: retoId, activo: true }).select('titulo estado escuela puntos');

  if (!reto) {
    res.status(404).json({
      success: false,
      message: 'Reto no encontrado o inactivo.',
    });
    return null;
  }

  if (debeEstarPublicado && reto.estado !== 'publicado') {
    res.status(400).json({
      success: false,
      message: 'Solo se puede enviar evidencia para retos publicados.',
    });
    return null;
  }

  return reto;
};

const validarAlumno = async (alumnoId, res) => {
  if (!isValidObjectId(alumnoId)) {
    res.status(400).json({
      success: false,
      message: 'El id del alumno no es valido.',
    });
    return null;
  }

  const alumno = await Usuario.findOne({ _id: alumnoId, activo: true }).select('nombre rol escuela puntos');

  if (!alumno) {
    res.status(404).json({
      success: false,
      message: 'Alumno no encontrado o inactivo.',
    });
    return null;
  }

  if (alumno.rol !== 'alumno') {
    res.status(403).json({
      success: false,
      message: 'Solo un usuario con rol alumno puede enviar evidencias.',
    });
    return null;
  }

  return alumno;
};

const validarRevisor = async (revisorId, res) => {
  if (!isValidObjectId(revisorId)) {
    res.status(400).json({
      success: false,
      message: 'El id del revisor no es valido.',
    });
    return null;
  }

  const revisor = await Usuario.findOne({ _id: revisorId, activo: true }).select('nombre rol escuela');

  if (!revisor) {
    res.status(404).json({
      success: false,
      message: 'Revisor no encontrado o inactivo.',
    });
    return null;
  }

  const rolNormalizado = String(revisor.rol || '').trim().toLowerCase();
  const rolCanonico = rolNormalizado === 'administrador/a' ? 'administrador' : rolNormalizado;

  if (!rolesRevisorPermitidos.includes(rolCanonico)) {
    res.status(403).json({
      success: false,
      message: 'Solo profesores o administradores pueden revisar evidencias.',
    });
    return null;
  }

  return revisor;
};

const validarMismaEscuela = (reto, usuario, mensaje, res) => {
  if (String(reto.escuela) !== String(usuario.escuela)) {
    res.status(400).json({
      success: false,
      message: mensaje,
    });
    return false;
  }

  return true;
};

const obtenerEvidenciaConRelaciones = async (id) => {
  return Evidencia.findById(id)
    .populate('reto', 'titulo estado puntos escuela')
    .populate('alumno', 'nombre email rol escuela puntos')
    .populate('revisadoPor', 'nombre email rol escuela');
};

const crearEvidencia = async (req, res) => {
  try {
    const camposPermitidos = [
      'reto',
      'alumno',
      'descripcion',
      'archivoUrl',
      'puntoRecoleccionNombre',
      'puntoRecoleccionCiudad',
    ];
    const camposRecibidos = Object.keys(req.body);
    const hayCampoInvalido = camposRecibidos.some((campo) => !camposPermitidos.includes(campo));

    if (hayCampoInvalido) {
      return res.status(400).json({
        success: false,
        message: 'Se recibieron campos no permitidos para crear la evidencia.',
      });
    }

    const { reto, alumno, descripcion, archivoUrl, puntoRecoleccionNombre, puntoRecoleccionCiudad } = req.body;

    if (!reto || !alumno || !archivoUrl || !puntoRecoleccionNombre || !puntoRecoleccionCiudad) {
      return res.status(400).json({
        success: false,
        message: 'reto, alumno, archivoUrl, puntoRecoleccionNombre y puntoRecoleccionCiudad son obligatorios.',
      });
    }

    const retoValido = await validarReto(reto, res, { debeEstarPublicado: true });
    if (!retoValido) {
      return;
    }

    const alumnoValido = await validarAlumno(alumno, res);
    if (!alumnoValido) {
      return;
    }

    const mismaEscuela = validarMismaEscuela(
      retoValido,
      alumnoValido,
      'El alumno debe pertenecer a la misma escuela del reto.',
      res
    );

    if (!mismaEscuela) {
      return;
    }

    const evidenciaExistente = await Evidencia.findOne({ reto, alumno, activo: true });

    if (evidenciaExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una evidencia activa para este reto y alumno.',
      });
    }

    const evidencia = await Evidencia.create({
      reto,
      alumno,
      descripcion,
      archivoUrl,
      puntoRecoleccionNombre: String(puntoRecoleccionNombre).trim(),
      puntoRecoleccionCiudad: String(puntoRecoleccionCiudad).trim(),
    });

    const evidenciaConRelaciones = await obtenerEvidenciaConRelaciones(evidencia._id);

    return res.status(201).json({
      success: true,
      message: 'Evidencia creada correctamente.',
      data: evidenciaConRelaciones,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerEvidencias = async (req, res) => {
  try {
    const incluirInactivas = req.query.incluirInactivas === 'true';
    const filtro = incluirInactivas ? {} : { activo: true };

    if (req.query.estado) {
      if (!estadosPermitidos.includes(req.query.estado)) {
        return res.status(400).json({
          success: false,
          message: 'El estado indicado no es valido.',
        });
      }

      filtro.estado = req.query.estado;
    }

    if (req.query.reto) {
      if (!isValidObjectId(req.query.reto)) {
        return res.status(400).json({
          success: false,
          message: 'El id de reto en el filtro no es valido.',
        });
      }

      filtro.reto = req.query.reto;
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

    if (req.query.revisadoPor) {
      if (!isValidObjectId(req.query.revisadoPor)) {
        return res.status(400).json({
          success: false,
          message: 'El id de revisor en el filtro no es valido.',
        });
      }

      filtro.revisadoPor = req.query.revisadoPor;
    }

    const evidencias = await Evidencia.find(filtro)
      .populate('reto', 'titulo estado puntos escuela')
      .populate('alumno', 'nombre email rol escuela puntos')
      .populate('revisadoPor', 'nombre email rol escuela')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Evidencias obtenidas correctamente.',
      data: evidencias,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerEvidenciaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la evidencia no es valido.',
      });
    }

    const evidencia = await obtenerEvidenciaConRelaciones(id);

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: 'Evidencia no encontrada.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Evidencia obtenida correctamente.',
      data: evidencia,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const aprobarEvidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisor, comentarioRevision } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la evidencia no es valido.',
      });
    }

    if (!revisor) {
      return res.status(400).json({
        success: false,
        message: 'El id del revisor es obligatorio.',
      });
    }

    const evidencia = await Evidencia.findById(id);

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: 'Evidencia no encontrada para aprobar.',
      });
    }

    if (!evidencia.activo) {
      return res.status(400).json({
        success: false,
        message: 'No se puede aprobar una evidencia inactiva.',
      });
    }

    if (evidencia.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aprobar evidencias pendientes.',
      });
    }

    const retoValido = await validarReto(evidencia.reto, res);
    if (!retoValido) {
      return;
    }

    const alumnoValido = await validarAlumno(evidencia.alumno, res);
    if (!alumnoValido) {
      return;
    }

    const revisorValido = await validarRevisor(revisor, res);
    if (!revisorValido) {
      return;
    }

    const alumnoMismaEscuela = validarMismaEscuela(
      retoValido,
      alumnoValido,
      'El alumno debe pertenecer a la misma escuela del reto.',
      res
    );

    if (!alumnoMismaEscuela) {
      return;
    }

    const revisorMismaEscuela = validarMismaEscuela(
      retoValido,
      revisorValido,
      'El revisor debe pertenecer a la misma escuela del reto.',
      res
    );

    if (!revisorMismaEscuela) {
      return;
    }

    evidencia.estado = 'aprobada';
    evidencia.revisadoPor = revisor;
    evidencia.fechaRevision = new Date();

    if (typeof comentarioRevision === 'string') {
      evidencia.comentarioRevision = comentarioRevision.trim();
    }

    await evidencia.save();

    await Usuario.findByIdAndUpdate(
      alumnoValido._id,
      { $inc: { puntos: retoValido.puntos } },
      {
        new: true,
        runValidators: true,
      }
    );

    const evidenciaConRelaciones = await obtenerEvidenciaConRelaciones(evidencia._id);

    return res.status(200).json({
      success: true,
      message: 'Evidencia aprobada correctamente y puntos asignados al alumno.',
      data: evidenciaConRelaciones,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const rechazarEvidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisor, comentarioRevision } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la evidencia no es valido.',
      });
    }

    if (!revisor) {
      return res.status(400).json({
        success: false,
        message: 'El id del revisor es obligatorio.',
      });
    }

    if (!comentarioRevision || !String(comentarioRevision).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un comentario de revision para rechazar la evidencia.',
      });
    }

    const evidencia = await Evidencia.findById(id);

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: 'Evidencia no encontrada para rechazar.',
      });
    }

    if (!evidencia.activo) {
      return res.status(400).json({
        success: false,
        message: 'No se puede rechazar una evidencia inactiva.',
      });
    }

    if (evidencia.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden rechazar evidencias pendientes.',
      });
    }

    const retoValido = await validarReto(evidencia.reto, res);
    if (!retoValido) {
      return;
    }

    const revisorValido = await validarRevisor(revisor, res);
    if (!revisorValido) {
      return;
    }

    const revisorMismaEscuela = validarMismaEscuela(
      retoValido,
      revisorValido,
      'El revisor debe pertenecer a la misma escuela del reto.',
      res
    );

    if (!revisorMismaEscuela) {
      return;
    }

    evidencia.estado = 'rechazada';
    evidencia.revisadoPor = revisor;
    evidencia.fechaRevision = new Date();
    evidencia.comentarioRevision = String(comentarioRevision).trim();

    await evidencia.save();

    const evidenciaConRelaciones = await obtenerEvidenciaConRelaciones(evidencia._id);

    return res.status(200).json({
      success: true,
      message: 'Evidencia rechazada correctamente.',
      data: evidenciaConRelaciones,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarEvidencia = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la evidencia no es valido.',
      });
    }

    const evidencia = await Evidencia.findByIdAndUpdate(
      id,
      { activo: false },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('reto', 'titulo estado puntos escuela')
      .populate('alumno', 'nombre email rol escuela puntos')
      .populate('revisadoPor', 'nombre email rol escuela');

    if (!evidencia) {
      return res.status(404).json({
        success: false,
        message: 'Evidencia no encontrada para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Evidencia desactivada correctamente.',
      data: evidencia,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearEvidencia,
  obtenerEvidencias,
  obtenerEvidenciaPorId,
  aprobarEvidencia,
  rechazarEvidencia,
  desactivarEvidencia,
};
