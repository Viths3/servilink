// ── Verificar que el usuario tenga al menos uno de los roles requeridos ──
const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const tieneRol = rolesPermitidos.some((rol) =>
      req.usuario.roles.includes(rol)
    );

    if (!tieneRol) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
