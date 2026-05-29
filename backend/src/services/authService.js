const bcrypt = require('bcrypt');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/jwt');

async function login(email, password) {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const token = signToken({ userId: user.id, role: user.role });
  const safe = await getMe(user.id);
  return { token, user: safe };
}

async function getMe(userId) {
  const { Commune } = require('../models');
  const user = await User.findByPk(userId, {
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
  if (!user) throw new ApiError(404, 'Usuario no encontrado');

  const safe = user.get({ plain: true });
  delete safe.passwordHash;

  const ids = new Set();
  if (safe.commune?.id) ids.add(safe.commune.id);
  (safe.communes || []).forEach((c) => ids.add(c.id));
  safe.communeIds = [...ids];

  return safe;
}

module.exports = { login, getMe };
