// Limpieza puntual de la base de datos de producción: conserva únicamente
// los 3 usuarios con rol 'admin' más antiguos y los 3 usuarios con rol
// 'cliente' más antiguos (por createdAt); borra todo lo demás, incluyendo
// en cascada cualquier anuncio, solicitud, pago, mensaje, reseña o
// notificación que dependa de un usuario eliminado.
//
// Es un script de un solo uso, no forma parte del flujo normal de la app.
// Doble seguro para no ejecutarlo por accidente:
//   1. Lee la cadena de conexión de .env.production (nunca de .env),
//      así nunca apunta por accidente al Mongo local de desarrollo.
//   2. Sin --confirmar hace un "dry run": solo muestra qué borraría, sin
//      tocar nada. Con --confirmar sí ejecuta los deleteMany.
//
// Uso:
//   node scripts/limpiar-produccion.js            (dry run, no borra nada)
//   node scripts/limpiar-produccion.js --confirmar (ejecuta el borrado real)

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });

const mongoose = require('mongoose');

const CONFIRMAR = process.argv.includes('--confirmar');

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Falta MONGODB_URI. Crea un archivo .env.production en la raíz del proyecto');
    console.error('con la cadena de conexión real de producción (Atlas) antes de correr esto.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ Conectado a MongoDB (${CONFIRMAR ? 'MODO REAL — SE VA A BORRAR' : 'dry run, no se borra nada'})`);

  const User             = require('../src/models/User');
  const Announcement     = require('../src/models/Announcement');
  const ServiceRequest   = require('../src/models/ServiceRequest');
  const Payment          = require('../src/models/Payment');
  const Review           = require('../src/models/Review');
  const Message          = require('../src/models/Message');
  const Notification     = require('../src/models/Notification');
  const UpgradeRequest   = require('../src/models/UpgradeRequest');

  // ── 1. Determinar quién se conserva ────────────────────────────
  const adminsAConservar = await User.find({ roles: 'admin' })
    .sort({ createdAt: 1 })
    .limit(3)
    .select('_id email createdAt');
  const clientesAConservar = await User.find({ roles: 'cliente' })
    .sort({ createdAt: 1 })
    .limit(3)
    .select('_id email createdAt');

  const idsAConservar = new Set(
    [...adminsAConservar, ...clientesAConservar].map((u) => u._id.toString())
  );

  const totalUsuarios = await User.countDocuments({});
  const usuariosABorrar = await User.find({ _id: { $nin: [...idsAConservar] } }).select('_id');
  const idsABorrar = usuariosABorrar.map((u) => u._id);

  console.log('\n── Usuarios que se conservan ──');
  [...adminsAConservar, ...clientesAConservar].forEach((u) =>
    console.log(`  · ${u.email} (creado ${u.createdAt.toISOString()})`)
  );
  console.log(`\nTotal usuarios en la BD: ${totalUsuarios}`);
  console.log(`Usuarios a conservar: ${idsAConservar.size}`);
  console.log(`Usuarios a borrar: ${idsABorrar.length}`);

  if (idsAConservar.size < 6) {
    console.warn(
      `\n⚠️  Solo se encontraron ${idsAConservar.size} usuarios para conservar ` +
      `(se esperaban hasta 3 admin + 3 cliente). Puede que no existan suficientes ` +
      `cuentas con esos roles. Revisa la lista de arriba antes de confirmar.`
    );
  }

  // ── 2. Capturar IDs dependientes ANTES de borrar nada ──────────
  const anunciosABorrar = await Announcement.find({ proveedor: { $in: idsABorrar } }).select('_id');
  const idsAnunciosABorrar = anunciosABorrar.map((a) => a._id);

  const solicitudesABorrar = await ServiceRequest.find({
    $or: [
      { cliente: { $in: idsABorrar } },
      { proveedor: { $in: idsABorrar } },
      { anuncio: { $in: idsAnunciosABorrar } },
    ],
  }).select('_id');
  const idsSolicitudesABorrar = solicitudesABorrar.map((s) => s._id);

  const conteos = {
    anuncios:      idsAnunciosABorrar.length,
    solicitudes:   idsSolicitudesABorrar.length,
    pagos:         await Payment.countDocuments({
      $or: [
        { cliente: { $in: idsABorrar } },
        { proveedor: { $in: idsABorrar } },
        { solicitud: { $in: idsSolicitudesABorrar } },
      ],
    }),
    resenas:       await Review.countDocuments({
      $or: [
        { cliente: { $in: idsABorrar } },
        { proveedor: { $in: idsABorrar } },
        { solicitud: { $in: idsSolicitudesABorrar } },
      ],
    }),
    mensajes:      await Message.countDocuments({
      $or: [{ de: { $in: idsABorrar } }, { para: { $in: idsABorrar } }],
    }),
    notificaciones: await Notification.countDocuments({ usuario: { $in: idsABorrar } }),
    solicitudesUpgrade: await UpgradeRequest.countDocuments({ usuario: { $in: idsABorrar } }),
  };

  console.log('\n── Datos dependientes que se borrarán en cascada ──');
  console.log(conteos);

  if (!CONFIRMAR) {
    console.log('\n🟡 Dry run: no se borró nada. Vuelve a ejecutar con --confirmar para aplicar los cambios.');
    await mongoose.disconnect();
    return;
  }

  // ── 3. Borrado real, en orden (hijos antes que padres) ─────────
  await Message.deleteMany({ $or: [{ de: { $in: idsABorrar } }, { para: { $in: idsABorrar } }] });
  await Notification.deleteMany({ usuario: { $in: idsABorrar } });
  await Review.deleteMany({
    $or: [
      { cliente: { $in: idsABorrar } },
      { proveedor: { $in: idsABorrar } },
      { solicitud: { $in: idsSolicitudesABorrar } },
    ],
  });
  await Payment.deleteMany({
    $or: [
      { cliente: { $in: idsABorrar } },
      { proveedor: { $in: idsABorrar } },
      { solicitud: { $in: idsSolicitudesABorrar } },
    ],
  });
  await ServiceRequest.deleteMany({ _id: { $in: idsSolicitudesABorrar } });
  await Announcement.deleteMany({ _id: { $in: idsAnunciosABorrar } });
  await UpgradeRequest.deleteMany({ usuario: { $in: idsABorrar } });
  // Si una solicitud de upgrade sobrevive (usuario conservado) pero fue
  // revisada por un admin eliminado, se limpia la referencia colgante.
  await UpgradeRequest.updateMany({ revisadoPor: { $in: idsABorrar } }, { $set: { revisadoPor: null } });
  await User.deleteMany({ _id: { $in: idsABorrar } });

  console.log('\n✅ Limpieza completada. Usuarios restantes:');
  const restantes = await User.find({}).select('email roles createdAt').sort({ createdAt: 1 });
  restantes.forEach((u) => console.log(`  · ${u.email} — ${u.roles.join(', ')}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error durante la limpieza:', err.message);
  process.exit(1);
});
