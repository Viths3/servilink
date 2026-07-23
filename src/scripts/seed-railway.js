require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CATEGORIAS = [
  'electricidad',
  'plomeria',
  'medicina',
  'carpinteria',
  'asesoria',
  'jardineria',
  'limpieza',
  'pintura',
  'mecanica',
  'diseno',
  'fotografia',
  'otro',
];

async function seed() {
  // Este script BORRA toda la colección de usuarios y anuncios antes de
  // insertar datos de prueba. Nunca debe poder correr contra producción por
  // accidente (ej. copiar el comando equivocado con el .env de prod cargado).
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DESTRUCTIVE_SEED) {
    console.error('Este script borra la base de datos y está bloqueado en producción.');
    console.error('Define ALLOW_DESTRUCTIVE_SEED=yes si de verdad quieres ejecutarlo aquí.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const User = mongoose.model(
      'User',
      new mongoose.Schema(
        {
          nombre: String,
          email: { type: String, unique: true, lowercase: true, trim: true },
          password: String,
          telefono: String,
          roles: [String],
          fotoPerfil: { type: String, default: '' },
          activo: { type: Boolean, default: true },
          providerData: { type: mongoose.Schema.Types.Mixed, default: null },
        },
        { timestamps: true }
      )
    );

    const Announcement = mongoose.model(
      'Announcement',
      new mongoose.Schema(
        {
          titulo: String,
          descripcion: String,
          categoria: String,
          proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          precioRef: Number,
          imagenes: [String],
          imagenUrl: String,
          estado: { type: String, default: 'activo' },
        },
        { timestamps: true }
      )
    );

    // Limpiar BD
    await User.deleteMany({});
    await Announcement.deleteMany({});
    console.log('🗑️  BD limpiada');

    // Crear proveedores
    const providers = [];
    for (let i = 0; i < 6; i++) {
      const categoria = CATEGORIAS[i];
      const provider = await User.create({
        nombre: `Proveedor ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`,
        email: `proveedor${i + 1}@servilink.com`,
        password: await bcrypt.hash('password123', 10),
        telefono: `+593${99000000 + i}`,
        roles: ['provider'],
        activo: true,
        providerData: {
          cedula: `17000000${i}`,
          categoria: categoria,
          descripcion: `Profesional en ${categoria} con 5+ años de experiencia`,
          verificationStatus: 'aprobado',
        },
      });
      providers.push(provider);
      console.log(`✅ Proveedor creado: ${provider.email}`);
    }

    // Crear clientes
    const clients = [];
    for (let i = 0; i < 3; i++) {
      const client = await User.create({
        nombre: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@servilink.com`,
        password: await bcrypt.hash('password123', 10),
        telefono: `+593${98000000 + i}`,
        roles: ['customer'],
        activo: true,
      });
      clients.push(client);
      console.log(`✅ Cliente creado: ${client.email}`);
    }

    // Crear anuncios
    const announcements = [];
    for (let i = 0; i < providers.length; i++) {
      const announcement = await Announcement.create({
        titulo: `Servicio de ${providers[i].providerData.categoria}`,
        descripcion: `Ofrecemos servicios profesionales de ${providers[i].providerData.categoria}. Contamos con experiencia y garantía de calidad.`,
        categoria: providers[i].providerData.categoria,
        proveedor: providers[i]._id,
        precioRef: Math.floor(Math.random() * 500) + 50,
        estado: 'activo',
      });
      announcements.push(announcement);
      console.log(`✅ Anuncio creado: ${announcement.titulo}`);
    }

    console.log('\n✨ Seed completado exitosamente');
    console.log(`📊 Resumen:`);
    console.log(`  - Proveedores: ${providers.length}`);
    console.log(`  - Clientes: ${clients.length}`);
    console.log(`  - Anuncios: ${announcements.length}`);
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

seed();
