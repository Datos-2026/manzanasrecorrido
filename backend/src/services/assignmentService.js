const { Op } = require('sequelize');
const { BlockAssignment, Block } = require('../models');
const ApiError = require('../utils/ApiError');

async function hasActiveAssignment(userId, blockId) {
  const assignment = await BlockAssignment.findOne({
    where: { userId, blockId, isActive: true },
  });
  return !!assignment;
}

async function ensureNoDuplicateActive(userId, blockId, excludeId = null) {
  const where = { userId, blockId, isActive: true };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const existing = await BlockAssignment.findOne({ where });
  if (existing) {
    throw new ApiError(409, 'Ya existe una asignación activa para este usuario y manzana');
  }
}

async function validateBlockInCommune(blockId, communeId) {
  const block = await Block.findByPk(blockId);
  if (!block) throw new ApiError(404, 'Manzana no encontrada');
  if (block.communeId !== communeId) {
    throw new ApiError(403, 'La manzana no pertenece a tu comuna');
  }
  return block;
}

module.exports = {
  hasActiveAssignment,
  ensureNoDuplicateActive,
  validateBlockInCommune,
};
