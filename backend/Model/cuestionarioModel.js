const mongoose = require('mongoose');

const estadosCuestionario = ['borrador', 'publicado', 'cerrado'];
const tiposPregunta = [
  'seleccion_unica',
  'seleccion_multiple',
  'verdadero_falso',
  'completacion',
  'respuesta_corta',
];

const modalidadesCuestionario = ['mixto', ...tiposPregunta];
const tiposConOpciones = ['seleccion_unica', 'seleccion_multiple', 'verdadero_falso'];
const tiposRespuestaTexto = ['completacion', 'respuesta_corta'];

const preguntaSchema = new mongoose.Schema(
  {
    enunciado: {
      type: String,
      required: [true, 'El enunciado de la pregunta es obligatorio.'],
      trim: true,
      minlength: [5, 'El enunciado debe tener al menos 5 caracteres.'],
    },
    tipo: {
      type: String,
      enum: tiposPregunta,
      default: 'seleccion_unica',
    },
    opciones: {
      type: [String],
      validate: {
        validator(value) {
          if (tiposConOpciones.includes(this.tipo)) {
            if (!Array.isArray(value) || value.length < 2) {
              return false;
            }

            if (this.tipo === 'verdadero_falso' && value.length !== 2) {
              return false;
            }

            return value.every((opcion) => typeof opcion === 'string' && opcion.trim().length > 0);
          }

          return !Array.isArray(value) || value.length === 0;
        },
        message: 'Las preguntas de seleccion requieren opciones validas; verdadero/falso debe tener 2 opciones.',
      },
      default: undefined,
    },
    respuestaCorrecta: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'La respuesta correcta es obligatoria.'],
      validate: {
        validator(value) {
          if (['seleccion_unica', 'verdadero_falso'].includes(this.tipo)) {
            if (!Number.isInteger(value) || !Array.isArray(this.opciones)) {
              return false;
            }

            return value >= 0 && value < this.opciones.length;
          }

          if (this.tipo === 'seleccion_multiple') {
            if (!Array.isArray(value) || value.length === 0 || !Array.isArray(this.opciones)) {
              return false;
            }

            const indicesValidos = value.every(
              (indice) => Number.isInteger(indice) && indice >= 0 && indice < this.opciones.length
            );

            if (!indicesValidos) {
              return false;
            }

            const indicesUnicos = new Set(value);
            return indicesUnicos.size === value.length;
          }

          if (tiposRespuestaTexto.includes(this.tipo)) {
            return typeof value === 'string' && value.trim().length > 0;
          }

          return false;
        },
        message: 'La respuesta correcta no es valida para el tipo de pregunta seleccionado.',
      },
    },
    puntaje: {
      type: Number,
      default: 1,
      min: [1, 'El puntaje por pregunta debe ser mayor a 0.'],
    },
  },
  {
    _id: false,
  }
);

const cuestionarioSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El titulo del cuestionario es obligatorio.'],
      trim: true,
      minlength: [3, 'El titulo debe tener al menos 3 caracteres.'],
    },
    descripcion: {
      type: String,
      trim: true,
    },
    grado: {
      type: String,
      trim: true,
    },
    modalidad: {
      type: String,
      enum: modalidadesCuestionario,
      default: 'mixto',
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela del cuestionario es obligatoria.'],
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El creador del cuestionario es obligatorio.'],
    },
    preguntas: {
      type: [preguntaSchema],
      validate: {
        validator(value) {
          if (!Array.isArray(value) || value.length === 0) {
            return false;
          }

          if (this.modalidad === 'mixto') {
            return true;
          }

          return value.every((pregunta) => pregunta && pregunta.tipo === this.modalidad);
        },
        message: 'El cuestionario debe tener al menos una pregunta y respetar la modalidad seleccionada.',
      },
      required: [true, 'Las preguntas del cuestionario son obligatorias.'],
    },
    estado: {
      type: String,
      enum: estadosCuestionario,
      default: 'borrador',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Cuestionario', cuestionarioSchema, 'cuestionarios');
