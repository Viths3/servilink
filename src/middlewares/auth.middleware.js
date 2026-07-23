const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Verificar JWT ─────────────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario aún existe y está activo
    const usuario = await User.findById(decoded.userId);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Token inválido o cuenta desactivada' });
    }

    // Si la contraseña cambió después de emitirse este token, invalidarlo
    // aunque todavía no haya expirado (evita que un token robado siga
    // funcionando después de que el usuario cambia su contraseña).
    if (usuario.passwordChangedAt) {
      const cambiadaEnSegundos = Math.floor(usuario.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < cambiadaEnSegundos) {
        return res.status(401).json({ error: 'Tu sesión expiró porque la contraseña cambió. Inicia sesión nuevamente.' });
      }
    }

    // Adjuntar usuario al request para uso en controladores
    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Inicia sesión nuevamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    console.error('authMiddleware:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = authMiddleware;
