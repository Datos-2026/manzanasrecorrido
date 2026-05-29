const { User, Commune } = require('../models');
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

    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] },
        {
          model: Commune,
          as: 'communes',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] },
        },
      ],
    });
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Usuario no autorizado');
    }

    const safe = user.get({ plain: true });
    delete safe.passwordHash;

    // Combinar comuna principal + many-to-many
    const communeIds = new Set();
    if (safe.commune?.id) communeIds.add(safe.commune.id);
    (safe.communes || []).forEach((c) => communeIds.add(c.id));
    safe.communeIds = [...communeIds];

    req.user = safe;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token inválido o expirado'));
    }
    next(err);
  }
}

module.exports = authMiddleware;
