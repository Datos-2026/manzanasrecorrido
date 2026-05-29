const { Op } = require('sequelize');
const { Block, Commune, BlockAssignment } = require('../models');
const ApiError = require('../utils/ApiError');
const { getUserCommuneIds, isAllowedCommune } = require('../utils/communeAccess');

async function list(req, res, next) {
  try {
    if (req.user.role === 'recorredor') {
      throw new ApiError(403, 'No tenés permisos');
    }

    const { communeId, assigned, search, active } = req.query;
    const where = {};

    if (req.user.role === 'coordinador') {
      where.communeId = { [Op.in]: getUserCommuneIds(req.user) };
    } else if (communeId) {
      where.communeId = communeId;
    }

    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    if (search) {
      where.code = { [Op.iLike]: `%${search}%` };
    }

    let blocks = await Block.findAll({
      where,
      include: [{ model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] }],
      order: [['code', 'ASC']],
    });

    if (assigned === 'true' && req.user.role === 'recorredor') {
      const assignments = await BlockAssignment.findAll({
        where: { userId: req.user.id, isActive: true },
        attributes: ['blockId'],
      });
      const ids = new Set(assignments.map((a) => a.blockId));
      blocks = blocks.filter((b) => ids.has(b.id));
    }

    res.json(blocks);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const block = await Block.findByPk(req.params.id, {
      include: [{ model: Commune, as: 'commune' }],
    });
    if (!block) throw new ApiError(404, 'Manzana no encontrada');

    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, block.communeId)) {
      throw new ApiError(403, 'No tenés permisos');
    }

    res.json(block);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = req.validated;
    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, data.communeId)) {
      throw new ApiError(403, 'No podés crear manzanas fuera de tus comunas');
    }

    const block = await Block.create(data);
    res.status(201).json(block);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new ApiError(409, 'El código de manzana ya existe'));
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) throw new ApiError(404, 'Manzana no encontrada');

    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, block.communeId)) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await block.update(req.validated);
    res.json(block);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) throw new ApiError(404, 'Manzana no encontrada');

    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, block.communeId)) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await block.update({ isActive: false });
    res.json({ message: 'Manzana desactivada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
