const mongoose = require('mongoose');

const insigniaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio.'],
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la insignia es obligatorio.'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    categoria: {
      type: String,
      default: 'general',
      trim: true,
    },
    criterio: {
      type: String,
      trim: true,
    },
    imagenUrl: {
      type: String,
      trim: true,
    },
    puntosOtorgados: {
      type: Number,
      default: 0,
      min: [0, 'Los puntos otorgados no pueden ser negativos.'],
    },
    fechaOtorgada: {
      type: Date,
      default: Date.now,
    },
    otorgadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
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

insigniaSchema.index({ usuario: 1, createdAt: -1 });

module.exports = mongoose.model('Insignia', insigniaSchema, 'insignias');
