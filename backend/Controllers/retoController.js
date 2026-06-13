const mongoose = require('mongoose');
const Reto = require('../Model/retoModel');
const Escuela = require('../Model/escuelaModel');
const Usuario = require('../Model/usuarioModel');
const { crearManejadorErroresMongoose } = require('../utils/mongooseErrorHandler');

const estadosPermitidos = ['borrador', 'publicado', 'cerrado'];
const rolesCreadorPermitidos = ['profesor', 'administrador'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const manejarErrorMongoose = crearManejadorErroresMongoose({
  duplicateMessage: 'Ya existe un reto con un valor unico duplicado.',
  validationMessage: 'Datos invalidos para el reto.',
});

const validarEscuela = async (escuelaId, res) => {
  if (!isValidObjectId(escuelaId)) {
    res.status(400).json({
      success: false,
      message: 'El id de escuela no es valido.',
    });
    return null;
  }

  const escuela = await Escuela.findOne({ _id: escuelaId, activa: true });

  if (!escuela) {
    res.status(404).json({
      success: false,
      message: 'Escuela no encontrada o inactiva.',
    });
    return null;
  }

  return escuela;
};

const validarCreador = async (creadorId, res) => {
  if (!isValidObjectId(creadorId)) {
    res.status(400).json({
      success: false,
      message: 'El id del creador no es valido.',
    });
    return null;
  }

  const creador = await Usuario.findOne({ _id: creadorId, activo: true }).select('nombre rol escuela');

  if (!creador) {
    res.status(404).json({
      success: false,
      message: 'Usuario creador no encontrado o inactivo.',
    });
    return null;
  }

  if (!rolesCreadorPermitidos.includes(creador.rol)) {
    res.status(403).json({
      success: false,
      message: 'Solo profesores o administradores pueden crear retos.',
    });
    return null;
  }

  return creador;
};

const validarRelacionEscuelaCreador = (escuelaId, creador, res) => {
  if (String(creador.escuela) !== String(escuelaId)) {
    res.status(400).json({
      success: false,
      message: 'El creador debe pertenecer a la misma escuela del reto.',
    });
    return false;
  }

  return true;
};

const crearReto = async (req, res) => {
  try {
    const { escuela, creador } = req.body;

    const escuelaValida = await validarEscuela(escuela, res);
    if (!escuelaValida) {
      return;
    }

    const creadorValido = await validarCreador(creador, res);
    if (!creadorValido) {
      return;
    }

    const relacionValida = validarRelacionEscuelaCreador(escuela, creadorValido, res);
    if (!relacionValida) {
      return;
    }

    const reto = await Reto.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Reto creado correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerRetos = async (req, res) => {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };

    if (req.query.estado) {
      if (!estadosPermitidos.includes(req.query.estado)) {
        return res.status(400).json({
          success: false,
          message: 'El estado indicado no es valido.',
        });
      }

      filtro.estado = req.query.estado;
    } else {
      filtro.estado = 'publicado';
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

    if (req.query.creador) {
      if (!isValidObjectId(req.query.creador)) {
        return res.status(400).json({
          success: false,
          message: 'El id de creador en el filtro no es valido.',
        });
      }

      filtro.creador = req.query.creador;
    }

    if (req.query.grado) {
      const grado = String(req.query.grado).trim();
      filtro.$or = [{ grado }, { grado: { $exists: false } }, { grado: '' }, { grado: null }];
    }

    const retos = await Reto.find(filtro)
      .populate('escuela', 'nombre codigo')
      .populate('creador', 'nombre email rol')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Retos obtenidos correctamente.',
      data: retos,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const obtenerRetoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del reto no es valido.',
      });
    }

    const reto = await Reto.findById(id)
      .populate('escuela', 'nombre codigo')
      .populate('creador', 'nombre email rol');

    if (!reto) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reto obtenido correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const actualizarReto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del reto no es valido.',
      });
    }

    const camposPermitidos = [
      'titulo',
      'descripcion',
      'grado',
      'instrucciones',
      'categoria',
      'dificultad',
      'puntos',
      'fechaInicio',
      'fechaFin',
      'escuela',
      'creador',
      'imagenUrl',
      'activo',
    ];

    const camposRecibidos = Object.keys(req.body);
    const hayCampoInvalido = camposRecibidos.some((campo) => !camposPermitidos.includes(campo));

    if (hayCampoInvalido) {
      return res.status(400).json({
        success: false,
        message: 'Se recibieron campos no permitidos para actualizar el reto.',
      });
    }

    const reto = await Reto.findById(id);

    if (!reto) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado para actualizar.',
      });
    }

    const escuelaDestino = req.body.escuela || reto.escuela;
    const creadorDestino = req.body.creador || reto.creador;

    const escuelaValida = await validarEscuela(escuelaDestino, res);
    if (!escuelaValida) {
      return;
    }

    const creadorValido = await validarCreador(creadorDestino, res);
    if (!creadorValido) {
      return;
    }

    const relacionValida = validarRelacionEscuelaCreador(escuelaDestino, creadorValido, res);
    if (!relacionValida) {
      return;
    }

    camposRecibidos.forEach((campo) => {
      reto[campo] = req.body[campo];
    });

    await reto.save();

    return res.status(200).json({
      success: true,
      message: 'Reto actualizado correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const publicarReto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del reto no es valido.',
      });
    }

    const reto = await Reto.findById(id);

    if (!reto) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado para publicar.',
      });
    }

    if (!reto.activo) {
      return res.status(400).json({
        success: false,
        message: 'No se puede publicar un reto inactivo.',
      });
    }

    if (reto.estado === 'cerrado') {
      return res.status(400).json({
        success: false,
        message: 'No se puede publicar un reto cerrado.',
      });
    }

    reto.estado = 'publicado';
    await reto.save();

    return res.status(200).json({
      success: true,
      message: 'Reto publicado correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const cerrarReto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del reto no es valido.',
      });
    }

    const reto = await Reto.findById(id);

    if (!reto) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado para cerrar.',
      });
    }

    reto.estado = 'cerrado';
    reto.activo = false;
    await reto.save();

    return res.status(200).json({
      success: true,
      message: 'Reto cerrado correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

const desactivarReto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del reto no es valido.',
      });
    }

    const reto = await Reto.findByIdAndUpdate(
      id,
      { activo: false },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!reto) {
      return res.status(404).json({
        success: false,
        message: 'Reto no encontrado para desactivar.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reto desactivado correctamente.',
      data: reto,
    });
  } catch (error) {
    return manejarErrorMongoose(error, res);
  }
};

module.exports = {
  crearReto,
  obtenerRetos,
  obtenerRetoPorId,
  actualizarReto,
  publicarReto,
  cerrarReto,
  desactivarReto,
};
