const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del usuario es obligatorio.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria.'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres.'],
      select: false,
    },
    rol: {
      type: String,
      enum: ['alumno', 'profesor', 'administrador'],
      default: 'alumno',
    },
    escuela: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela asociada es obligatoria.'],
    },
    puntos: {
      type: Number,
      default: 0,
      min: 0,
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

usuarioSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');
