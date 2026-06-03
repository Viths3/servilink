require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL    = 'admin@servilink.com';
const ADMIN_PASSWORD = 'admin12345678';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB.');

  // El modelo User aplica el hook pre-save de bcrypt, pero lo usamos directamente
  // para no depender del módulo completo y evitar efectos secundarios del modelo.
  const UserSchema = new mongoose.Schema(
    {
      nombre:      String,
      email:       { type: String, lowercase: true, trim: true },
      password:    String,
      telefono:    String,
      roles:       [String],
      fotoPerfil:  { type: String, default: '' },
      activo:      { type: Boolean, default: true },
      providerData: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
  );

  // Reutiliza el modelo si ya fue compilado (útil en entornos con hot-reload)
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existente = await User.findOne({ email: ADMIN_EMAIL });

  if (existente) {
    existente.roles = ['admin'];
    await existente.save();
    console.log(`✔  Usuario existente actualizado: ${ADMIN_EMAIL} → roles: ['admin']`);
  } else {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      nombre:   'Admin ServiLink',
      email:    ADMIN_EMAIL,
      password: hash,
      telefono: '+593990000001',
      roles:    ['admin'],
    });
    console.log(`✔  Usuario administrador creado: ${ADMIN_EMAIL}`);
    console.log(`   Contraseña inicial: ${ADMIN_PASSWORD}  ← cámbiala tras el primer login`);
  }
}

main()
  .catch((err) => {
    console.error('Error en seed-admin:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
