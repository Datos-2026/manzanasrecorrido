const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.scope('withPassword').findByPk(decoded.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Usuario no autorizado');
    }

    req.user = user.toSafeJSON();
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token inválido o expirado'));
    }
    next(err);
  }
}

module.exports = authMiddleware;
