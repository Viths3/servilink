require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Nunca hardcodear credenciales de admin: ambas se exigen por variable de
// entorno y la contraseña NUNCA se imprime en consola/logs (ni siquiera la
// que puso quien ejecuta el script) — evita que quede en logs de Railway/CI.
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Define ADMIN_EMAIL y ADMIN_INITIAL_PASSWORD como variables de entorno antes de ejecutar este script.');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 12) {
  console.error('ADMIN_INITIAL_PASSWORD debe tener al menos 12 caracteres.');
  process.exit(1);
}

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
    console.log('   Usa la contraseña que definiste en ADMIN_INITIAL_PASSWORD para iniciar sesión.');
  }
}

main()
  .catch((err) => {
    console.error('Error en seed-admin:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
