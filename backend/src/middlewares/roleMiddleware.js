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

const { Op } = require('sequelize');
const { getUserCommuneIds, isAllowedCommune } = require('../utils/communeAccess');

function assertSameCommune(user, communeId) {
  return isAllowedCommune(user, communeId);
}

function getCommuneFilter(user) {
  if (user.role === 'admin') return {};
  return { communeId: { [Op.in]: getUserCommuneIds(user) } };
}

module.exports = {
  requireRoles,
  assertAdmin,
  assertSameCommune,
  getCommuneFilter,
};
