const ApiError = require('../utils/ApiError');

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'No autenticado'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'No tenés permisos para esta acción'));
    }
    next();
  };
}

function assertAdmin(user) {
  return user.role === 'admin';
}

function assertSameCommune(user, communeId) {
  if (user.role === 'admin') return true;
  if (user.role === 'coordinador' && user.communeId === communeId) return true;
  return false;
}

function getCommuneFilter(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'coordinador') return { communeId: user.communeId };
  return { communeId: user.communeId };
}

module.exports = {
  requireRoles,
  assertAdmin,
  assertSameCommune,
  getCommuneFilter,
};
