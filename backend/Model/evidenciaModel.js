const mongoose = require('mongoose');

const estadosEvidencia = ['pendiente', 'aprobada', 'rechazada'];

const evidenciaSchema = new mongoose.Schema(
  {
    reto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reto',
      required: [true, 'El reto asociado es obligatorio.'],
    },
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El alumno asociado es obligatorio.'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripcion no puede superar 500 caracteres.'],
    },
    archivoUrl: {
      type: String,
      required: [true, 'La URL del archivo de evidencia es obligatoria.'],
      trim: true,
    },
    estado: {
      type: String,
      enum: estadosEvidencia,
      default: 'pendiente',
    },
    comentarioRevision: {
      type: String,
      trim: true,
      maxlength: [500, 'El comentario de revision no puede superar 500 caracteres.'],
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaRevision: {
      type: Date,
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

evidenciaSchema.index(
  { reto: 1, alumno: 1, activo: 1 },
  { unique: true, partialFilterExpression: { activo: true } }
);

module.exports = mongoose.model('Evidencia', evidenciaSchema, 'evidencias');
