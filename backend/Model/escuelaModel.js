const mongoose = require('mongoose');

const escuelaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la escuela es obligatorio.'],
      trim: true,
    },
    codigo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    departamento: {
      type: String,
      trim: true,
    },
    municipio: {
      type: String,
      trim: true,
    },
    direccion: {
      type: String,
      trim: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Escuela', escuelaSchema, 'escuelas');
