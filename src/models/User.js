const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── SUBDOCUMENTO: ProviderData ────────────────────────────────────
const providerDataSchema = new mongoose.Schema(
  {
    cedula:             { type: String, required: true },
    categoria:          {
      type: String,
      required: true,
      enum: ['electricidad', 'plomeria', 'medicina', 'carpinteria', 'asesoria', 'jardineria', 'limpieza', 'pintura', 'mecanica', 'diseno', 'fotografia', 'otro'],
    },
    descripcion:        { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['none', 'pendiente', 'aprobado', 'rechazado'],
      default: 'pendiente',
    },
    documentos:         [{ type: String }],   // URLs de archivos
    comentarioAdmin:    { type: String, default: '' },
    fechaVerificacion:  { type: Date },
  },
  { _id: false }
);

// ── ESQUEMA PRINCIPAL: Usuario ────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    nombre:       { type: String, required: [true, 'El nombre es requerido'], trim: true },
    email:        {
      type: String,
      required: [true, 'El correo es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de correo inválido'],
    },
    password:     { type: String, required: [true, 'La contraseña es requerida'], minlength: 8 },
    telefono:     {
      type: String,
      required: [true, 'El teléfono es requerido'],
      match: [/^\+\d{10,15}$/, 'Formato de teléfono inválido (usar +593XXXXXXXXX)'],
    },
    roles:        {
      type: [String],
      enum: ['cliente', 'proveedor', 'admin'],
      default: ['cliente'],
    },
    fotoPerfil:   { type: String, default: '' },
    activo:       { type: Boolean, default: true },
    providerData: { type: providerDataSchema, default: null },
  },
  { timestamps: true }
);

// ── ÍNDICES ───────────────────────────────────────────────────────

userSchema.index({ 'providerData.cedula': 1 }, { sparse: true });
userSchema.index({ roles: 1 });

// ── HOOK: Hash de contraseña antes de guardar ─────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ── MÉTODO: Comparar contraseña ───────────────────────────────────
userSchema.methods.compararPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

// ── MÉTODO ESTÁTICO: Validar cédula ecuatoriana (módulo 10) ───────
userSchema.statics.validarCedula = function (cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  const digitos = cedula.split('').map(Number);
  const verificador = digitos[9];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = digitos[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    suma += val;
  }
  const residuo = suma % 10;
  return residuo === 0 ? verificador === 0 : (10 - residuo) === verificador;
};

// ── TRANSFORMAR JSON: nunca exponer password ──────────────────────
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
