const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
