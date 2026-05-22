const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Commune } = require('../models');
const ApiError = require('../utils/ApiError');
async function list(req, res, next) {
  try {
    const where = {};
    if (req.user.role === 'coordinador') {
      where.communeId = req.user.communeId;
    } else if (req.user.role === 'admin') {
      // sin filtro
    } else {
      throw new ApiError(403, 'No tenés permisos');
    }

    const users = await User.findAll({
      where,
      include: [{ model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] }],
      order: [['lastName', 'ASC']],
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Commune, as: 'commune' }],
    });
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador' && user.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (req.user.role === 'recorridor' && req.params.id !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = req.validated;

    if (req.user.role === 'coordinador') {
      if (data.role === 'admin') throw new ApiError(403, 'No podés crear administradores');
      data.communeId = req.user.communeId;
    }

    if (data.role !== 'admin' && !data.communeId && req.user.role === 'admin') {
      throw new ApiError(400, 'Los usuarios no admin deben tener comuna asignada');
    }

    const existing = await User.scope('withPassword').findOne({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'El email ya está registrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      role: data.role,
      communeId: data.role === 'admin' ? null : data.communeId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await User.scope('withPassword').findByPk(req.params.id);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador') {
      if (user.communeId !== req.user.communeId) throw new ApiError(403, 'No tenés permisos');
      if (req.validated.role === 'admin') throw new ApiError(403, 'No podés asignar rol admin');
    }

    const data = { ...req.validated };
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    if (req.user.role === 'coordinador') {
      data.communeId = req.user.communeId;
    }

    await user.update(data);
    await user.reload();
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador' && user.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await user.update({ isActive: false });
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
