const mongoose = require('mongoose');

const tiposRanking = ['general', 'escuela'];

const rankingSchema = new mongoose.Schema(
  {
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El alumno es obligatorio.'],
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
    },
    tipo: {
      type: String,
      enum: tiposRanking,
      default: 'general',
    },
    periodo: {
      type: String,
      default: 'general',
      trim: true,
    },
    puntos: {
      type: Number,
      required: [true, 'Los puntos son obligatorios.'],
      min: [0, 'Los puntos no pueden ser negativos.'],
    },
    posicion: {
      type: Number,
      required: [true, 'La posicion es obligatoria.'],
      min: [1, 'La posicion debe ser mayor o igual a 1.'],
    },
    fechaCalculo: {
      type: Date,
      default: Date.now,
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

rankingSchema.index({ tipo: 1, periodo: 1, alumno: 1, escuela: 1 }, { unique: true });

module.exports = mongoose.model('Ranking', rankingSchema, 'rankings');
