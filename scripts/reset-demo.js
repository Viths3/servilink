// Vista previa por defecto. --apply requiere el nombre exacto de la base.
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');
const { gzipSync } = require('zlib');
const { EJSON } = mongoose.mongo.BSON;
const catalogo = require('./demo-catalogo.json');
const User = require('../src/models/User');
const Announcement = require('../src/models/Announcement');
const ServiceRequest = require('../src/models/ServiceRequest');
const Review = require('../src/models/Review');
const Message = require('../src/models/Message');
const Notification = require('../src/models/Notification');

function cedula(indice) {
  const base = `010${String(1000 + indice).padStart(6, '0')}`;
  const suma = [...base].reduce((sum, digito, i) => {
    const n = Number(digito) * (i % 2 === 0 ? 2 : 1);
    return sum + (n > 9 ? n - 9 : n);
  }, 0);
  return base + ((10 - suma % 10) % 10);
}

async function prepararDatos() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
  const demoPassword = process.env.DEMO_PASSWORD || '';
  if (!email || adminPassword.length < 12 || demoPassword.length < 12) {
    throw new Error('Define ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD y DEMO_PASSWORD (contraseñas de al menos 12 caracteres).');
  }
  if (email.endsWith('@servilink-demo.com')) throw new Error('El administrador debe usar un correo distinto del dominio demo.');
  for (const c of catalogo) {
    await fs.access(path.join(__dirname, `../frontend/public/referencias/${c.categoria}.jpg`));
  }
  await fs.access(path.join(__dirname, '../frontend/public/referencias/avatar.svg'));
  const [adminHash, demoHash] = await Promise.all([bcrypt.hash(adminPassword, 12), bcrypt.hash(demoPassword, 12)]);
  const ahora = new Date();
  const usuario = (data, hash = demoHash) => new User({
    _id: new mongoose.Types.ObjectId(), fotoPerfil: '/referencias/avatar.svg',
    activo: true, createdAt: ahora, updatedAt: ahora, ...data, password: hash,
  });
  const admin = usuario({ nombre: 'Admin ServiLink', email, telefono: '+593990000001', roles: ['admin'] }, adminHash);
  const proveedores = catalogo.map((c, i) => usuario({
    nombre: `${c.nombreProveedor} (Demo)`, email: `demo.${c.categoria}@servilink-demo.com`,
    telefono: `+59398000${String(i + 1).padStart(4, '0')}`, roles: ['proveedor'],
    providerData: { cedula: cedula(i), categoria: c.categoria,
      descripcion: `[Perfil de demostración] ${c.descripcionProveedor}`, verificationStatus: 'aprobado', fechaVerificacion: ahora },
  }));
  const clientes = ['Diana Espinoza', 'Roberto Malla', 'Verónica Chica'].map((nombre, i) => usuario({
    nombre: `${nombre} (Demo)`, email: `demo.cliente${i + 1}@servilink-demo.com`,
    telefono: `+59398700000${i + 1}`, roles: ['cliente'],
  }));
  const anuncios = catalogo.map((c, i) => new Announcement({
    proveedor: proveedores[i]._id, titulo: c.titulo,
    descripcion: `[Anuncio demo · Imagen de referencia]\n\n${c.descripcion}`,
    categoria: c.categoria, precioRef: c.precioRef,
    imagenes: [`/referencias/${c.categoria}.jpg`], estado: 'activo',
  }));
  const estados = ['pendiente', 'aceptada', 'rechazada', 'reagendada', 'completada', 'completada'];
  const solicitudes = estados.map((estado, i) => {
    const fecha = new Date(ahora.getTime() + (estado === 'completada' ? -7 : i + 2) * 86400000);
    return new ServiceRequest({ cliente: clientes[i % 3]._id, proveedor: proveedores[i]._id,
      anuncio: anuncios[i]._id, descripcion: '[Demo] Solicitud de ejemplo para conocer el funcionamiento de ServiLink.',
      fechaPropuesta: fecha, fechaConfirmada: ['aceptada', 'completada'].includes(estado) ? fecha : null,
      estado, motivoRechazo: estado === 'rechazada' ? 'Ejemplo: no hay disponibilidad.' : '',
      recordatorioVisitaEnviado: true, recordatorioPendienteEnviado: true,
    });
  });
  const resenas = solicitudes.filter((s) => s.estado === 'completada').map((s) => new Review({
    solicitud: s._id, cliente: s.cliente, proveedor: s.proveedor, puntuacion: 5,
    comentario: '[Demo] Reseña de ejemplo para mostrar el perfil del proveedor.',
  }));
  const mensajes = [new Message({ de: clientes[0]._id, para: proveedores[0]._id,
    contenido: '[Demo] Hola, quisiera conocer la disponibilidad para este servicio.' })];
  const notificaciones = [new Notification({ usuario: proveedores[0]._id, tipo: 'demo',
    mensaje: '[Demo] Tienes una solicitud de ejemplo para revisar.', link: '/dashboard' })];
  const lotes = [[User, [admin, ...proveedores, ...clientes]], [Announcement, anuncios],
    [ServiceRequest, solicitudes], [Review, resenas], [Message, mensajes], [Notification, notificaciones]];
  // Validar todo antes de borrar. Insertamos hashes ya calculados, sin ejecutar
  // el hook save de bcrypt por segunda vez ni enviar WhatsApp o pagos reales.
  for (const [, documentos] of lotes) for (const doc of documentos) {
    doc.createdAt = ahora;
    doc.updatedAt = ahora;
    await doc.validate();
  }
  return lotes;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI de producción en .env.production.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const colecciones = (await db.listCollections({}, { nameOnly: true }).toArray()).filter((c) => !c.name.startsWith('system.'));
  const conteos = {};
  for (const c of colecciones) conteos[c.name] = await db.collection(c.name).countDocuments();
  console.log('Base de destino:', db.databaseName);
  console.log('Datos actuales:', JSON.stringify(conteos));
  const lotes = await prepararDatos();
  console.log('Datos nuevos:', JSON.stringify(Object.fromEntries(lotes.map(([model, docs]) => [model.collection.name, docs.length]))));
  if (!process.argv.includes('--apply')) {
    console.log('Vista previa: no se ha modificado la base de datos.');
    return;
  }
  const index = process.argv.indexOf('--database');
  if (index < 0 || process.argv[index + 1] !== db.databaseName) {
    throw new Error('Para aplicar, indica --database con el nombre exacto mostrado en la vista previa.');
  }
  const publicURL = process.env.PUBLIC_URL;
  if (!publicURL || !publicURL.startsWith('https://')) {
    throw new Error('Define PUBLIC_URL con la URL HTTPS de Railway antes de aplicar.');
  }
  // No dejar una base nueva apuntando a imágenes aún sin desplegar.
  for (const asset of [...catalogo.map((c) => `${c.categoria}.jpg`), 'avatar.svg']) {
    const response = await fetch(new URL(`/referencias/${asset}`, publicURL), {
      method: 'HEAD', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error('Primero despliega las imágenes de referencia en Railway; todavía no están disponibles.');
    }
  }
  const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../backups'));
  if (process.env.RAILWAY_ENVIRONMENT_ID) {
    const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
    const relative = mount ? path.relative(path.resolve(mount), backupDir) : '..';
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('En Railway, BACKUP_DIR debe estar dentro de un volumen persistente.');
    }
  }
  await fs.mkdir(backupDir, { recursive: true });
  const backup = {};
  for (const c of colecciones) backup[c.name] = await db.collection(c.name).find({}).toArray();
  const filename = path.join(backupDir, `antes-reset-${db.databaseName}-${Date.now()}.ejson.gz`);
  await fs.writeFile(filename, gzipSync(EJSON.stringify(backup, { relaxed: false })), { flag: 'wx', mode: 0o600 });
  console.log('Copia completa guardada:', filename);
  for (const c of colecciones) await db.collection(c.name).deleteMany({});
  for (const [model, documentos] of lotes) await model.collection.insertMany(documentos.map((d) => d.toObject()));
  for (const [model, documentos] of lotes) {
    const total = await model.countDocuments();
    if (total !== documentos.length) throw new Error(`Conteo inesperado en ${model.collection.name}. Consulta la copia de respaldo.`);
  }
  const admin = await User.findOne({ roles: 'admin' });
  if (!await admin.compararPassword(process.env.ADMIN_INITIAL_PASSWORD)) throw new Error('Falló la verificación del administrador.');
  console.log('Reinicio completado y verificado. Las contraseñas no se muestran en logs.');
}

if (require.main === module) main().catch((err) => {
  // No imprimir errores de conexión que puedan incluir la URI o credenciales.
  console.error(['MongoServerSelectionError', 'MongoParseError', 'MongoNetworkError'].includes(err.name)
    ? 'No se pudo conectar a MongoDB de producción. Revisa la configuración y la red.' : err.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());

module.exports = { prepararDatos, cedula };
