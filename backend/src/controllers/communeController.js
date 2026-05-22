const { Commune } = require('../models');
const ApiError = require('../utils/ApiError');

async function list(req, res, next) {
  try {
    const communes = await Commune.findAll({ order: [['name', 'ASC']] });
    res.json(communes);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const commune = await Commune.findByPk(req.params.id);
    if (!commune) throw new ApiError(404, 'Comuna no encontrada');
    res.json(commune);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const commune = await Commune.create(req.validated);
    res.status(201).json(commune);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'El código de comuna ya existe'));
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const commune = await Commune.findByPk(req.params.id);
    if (!commune) throw new ApiError(404, 'Comuna no encontrada');
    await commune.update(req.validated);
    res.json(commune);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const commune = await Commune.findByPk(req.params.id);
    if (!commune) throw new ApiError(404, 'Comuna no encontrada');
    await commune.destroy();
    res.json({ message: 'Comuna eliminada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
