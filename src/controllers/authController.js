const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { evaluarVerificacionAutomatica, COMENTARIO_AUTO } = require('../services/verificationService');
const { notificarVerificacionAprobada } = require('../services/whatsappService');

// ── Generar JWT ───────────────────────────────────────────────────
const generarToken = (userId, roles) => {
  return jwt.sign(
    { userId, roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── RF-01: Registro de cliente ────────────────────────────────────
const registrarCliente = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !telefono) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar que el correo no exista
    const existe = await User.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    // Procesar foto de perfil si existe
    const fotoPerfil = req.file ? `/uploads/${req.file.filename}` : '';

    // Crear usuario
    const usuario = new User({
      nombre,
      email,
      password,
      telefono,
      fotoPerfil,
      roles: ['cliente'],
    });

    await usuario.save();

    const token = generarToken(usuario._id, usuario.roles);

    res.status(201).json({
      mensaje: 'Cuenta creada exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        fotoPerfil: usuario.fotoPerfil,
        roles: usuario.roles,
      },
    });
  } catch (err) {
    // Error de validación de Mongoose
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('registrarCliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-02: Registro de proveedor ──────────────────────────────────
const registrarProveedor = async (req, res) => {
  try {
    const { nombre, email, password, telefono, cedula, categoria, descripcion } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !telefono || !cedula || !categoria) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar cédula ecuatoriana
    if (!User.validarCedula(cedula)) {
      return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
    }

    // Verificar que el correo no exista
    const existeEmail = await User.findOne({ email: email.toLowerCase() });
    if (existeEmail) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    // Verificar que la cédula no esté registrada
    const existeCedula = await User.findOne({ 'providerData.cedula': cedula });
    if (existeCedula) {
      return res.status(409).json({ error: 'Ya existe una cuenta con esa cédula' });
    }

    // req.files es un objeto {fotoPerfil: [...], documentos: [...]} con upload.fields()
    const fotoFile  = req.files?.fotoPerfil?.[0];
    const fotoPerfil = fotoFile ? `/uploads/${fotoFile.filename}` : '';
    const documentos = (req.files?.documentos ?? []).map((f) => `/uploads/${f.filename}`);

    // Verificación automática: si los controles objetivos pasan, se aprueba
    // al instante; si no, queda pendiente para revisión manual del admin.
    const evaluacion = await evaluarVerificacionAutomatica({ cedula, documentos, telefono });

    // Crear usuario proveedor
    const usuario = new User({
      nombre,
      email,
      password,
      telefono,
      roles: ['proveedor'],
      fotoPerfil,
      providerData: {
        cedula,
        categoria,
        descripcion: descripcion || '',
        verificationStatus: evaluacion.aprobado ? 'aprobado' : 'pendiente',
        comentarioAdmin: evaluacion.aprobado ? COMENTARIO_AUTO : '',
        fechaVerificacion: evaluacion.aprobado ? new Date() : undefined,
        documentos,
      },
    });

    await usuario.save();

    if (evaluacion.aprobado) {
      await notificarVerificacionAprobada(usuario.telefono, usuario.nombre);
    }

    res.status(201).json({
      mensaje: evaluacion.aprobado
        ? '¡Cuenta creada y verificada! Ya puedes publicar tus servicios.'
        : 'Cuenta creada. Tu identidad será verificada por nuestro equipo. Te notificaremos por WhatsApp.',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        roles: usuario.roles,
        verificationStatus: usuario.providerData.verificationStatus,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const mensajes = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    console.error('registrarProveedor:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-03: Login con JWT ──────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario (incluir password para comparar)
    const usuario = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Error genérico: no revelar si el email existe o no
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar cuenta activa
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacta al soporte.' });
    }

    // Comparar contraseña
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generarToken(usuario._id, usuario.roles);

    res.json({
      mensaje: 'Sesión iniciada',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        roles: usuario.roles,
        fotoPerfil: usuario.fotoPerfil,
        verificationStatus: usuario.providerData?.verificationStatus || null,
      },
    });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── RF-04: Logout ─────────────────────────────────────────────────
// JWT es stateless: el cliente elimina el token.
// En el servidor solo confirmamos la acción.
const logout = async (req, res) => {
  res.json({ mensaje: 'Sesión cerrada correctamente' });
};

module.exports = { registrarCliente, registrarProveedor, login, logout };
