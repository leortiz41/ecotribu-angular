const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema(
  {
    preguntaIndex: {
      type: Number,
      required: [true, 'El indice de la pregunta es obligatorio.'],
      min: [0, 'El indice de la pregunta no puede ser negativo.'],
    },
    respuesta: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'La respuesta es obligatoria.'],
    },
    esCorrecta: {
      type: Boolean,
      default: false,
    },
    puntajeObtenido: {
      type: Number,
      default: 0,
      min: [0, 'El puntaje por respuesta no puede ser negativo.'],
    },
  },
  {
    _id: false,
  }
);

const resultadoCuestionarioSchema = new mongoose.Schema(
  {
    cuestionario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuestionario',
      required: [true, 'El cuestionario es obligatorio.'],
    },
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El alumno es obligatorio.'],
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es obligatoria.'],
    },
    respuestas: {
      type: [respuestaSchema],
      default: [],
    },
    puntajeObtenido: {
      type: Number,
      required: [true, 'El puntaje obtenido es obligatorio.'],
      min: [0, 'El puntaje obtenido no puede ser negativo.'],
    },
    puntajeMaximo: {
      type: Number,
      required: [true, 'El puntaje maximo es obligatorio.'],
      min: [0, 'El puntaje maximo no puede ser negativo.'],
    },
    porcentaje: {
      type: Number,
      min: [0, 'El porcentaje no puede ser negativo.'],
      max: [100, 'El porcentaje no puede ser mayor a 100.'],
    },
    aprobado: {
      type: Boolean,
      default: false,
    },
    intento: {
      type: Number,
      default: 1,
      min: [1, 'El intento debe ser mayor o igual a 1.'],
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

resultadoCuestionarioSchema.pre('validate', function calcularPorcentaje(next) {
  if (this.puntajeMaximo > 0) {
    this.porcentaje = Number(((this.puntajeObtenido / this.puntajeMaximo) * 100).toFixed(2));
  } else {
    this.porcentaje = 0;
  }

  next();
});

resultadoCuestionarioSchema.index({ cuestionario: 1, alumno: 1, intento: 1 }, { unique: true });

module.exports = mongoose.model(
  'ResultadoCuestionario',
  resultadoCuestionarioSchema,
  'resultados_cuestionarios'
);
