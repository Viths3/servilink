const rateLimit = require('express-rate-limit');

// Límite estricto para login: frena fuerza bruta y credential stuffing.
// No cuenta los intentos exitosos, así que un usuario legítimo que a veces
// se equivoca de contraseña no se ve afectado en el uso normal.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});

// Límite más laxo para registro: evita creación masiva automatizada de cuentas.
const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas cuentas creadas desde esta IP. Intenta de nuevo más tarde.' },
});

// Límite general para toda la API: no previene abuso dirigido (para eso están
// los límites específicos de arriba), pero pone un techo razonable al volumen
// total de peticiones por IP para mitigar scraping/DoS de bajo esfuerzo.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP. Intenta de nuevo más tarde.' },
});

module.exports = { loginLimiter, registroLimiter, apiLimiter };
