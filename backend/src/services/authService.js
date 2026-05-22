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
  return { token, user: user.toSafeJSON() };
}

async function getMe(userId) {
  const user = await User.findByPk(userId, {
    include: [{ association: 'commune', attributes: ['id', 'name', 'code'] }],
  });
  if (!user) throw new ApiError(404, 'Usuario no encontrado');
  return user.toSafeJSON();
}

module.exports = { login, getMe };
