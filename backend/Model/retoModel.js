const mongoose = require('mongoose');

const categoriasReto = [
  'reciclaje',
  'reutilizacion',
  'limpieza',
  'ahorro_agua',
  'ahorro_energia',
  'otro',
];

const estadosReto = ['borrador', 'publicado', 'cerrado'];

const retoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El titulo del reto es obligatorio.'],
      trim: true,
      minlength: [3, 'El titulo debe tener al menos 3 caracteres.'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripcion del reto es obligatoria.'],
      trim: true,
      minlength: [10, 'La descripcion debe tener al menos 10 caracteres.'],
    },
    instrucciones: {
      type: String,
      trim: true,
    },
    categoria: {
      type: String,
      enum: categoriasReto,
      default: 'otro',
    },
    dificultad: {
      type: String,
      enum: ['facil', 'media', 'dificil'],
      default: 'media',
    },
    puntos: {
      type: Number,
      default: 50,
      min: [1, 'Los puntos del reto deben ser mayores a 0.'],
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria.'],
    },
    fechaFin: {
      type: Date,
      required: [true, 'La fecha de cierre es obligatoria.'],
      validate: {
        validator(value) {
          if (!this.fechaInicio || !value) {
            return true;
          }

          return value >= this.fechaInicio;
        },
        message: 'La fecha de cierre no puede ser menor que la fecha de inicio.',
      },
    },
    estado: {
      type: String,
      enum: estadosReto,
      default: 'borrador',
    },
    activo: {
      type: Boolean,
      default: true,
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela del reto es obligatoria.'],
    },
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El creador del reto es obligatorio.'],
    },
    imagenUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Reto', retoSchema, 'retos');
