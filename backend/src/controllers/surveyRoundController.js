const {
  SurveyRound,
  Block,
  Commune,
  Visit,
  HygieneObservation,
  User,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { hasActiveAssignment } = require('../services/assignmentService');

const blockInclude = (commune = true) => ({
  model: Block,
  as: 'block',
  include: commune ? [{ model: Commune, as: 'commune' }] : [],
});

async function start(req, res, next) {
  try {
    const { blockId, weekNumber, notes } = req.validated;
    const userId = req.user.id;

    if (req.user.role === 'recorredor') {
      const assigned = await hasActiveAssignment(userId, blockId);
      if (!assigned) throw new ApiError(403, 'No tenés asignación activa para esta manzana');
    }

    const block = await Block.findByPk(blockId);
    if (!block) throw new ApiError(404, 'Manzana no encontrada');
    if (req.user.role === 'coordinador' && block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos sobre esta manzana');
    }

    const existing = await SurveyRound.findOne({
      where: { userId, blockId, isActive: true },
    });
    if (existing) {
      throw new ApiError(409, 'Ya existe un relevamiento activo para esta manzana');
    }

    const round = await SurveyRound.create({
      userId,
      blockId,
      weekNumber,
      notes: notes || null,
      isActive: true,
      startedAt: new Date(),
    });

    const full = await SurveyRound.findByPk(round.id, { include: [blockInclude()] });
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
}

async function active(req, res, next) {
  try {
    const { blockId } = req.query;
    if (!blockId) throw new ApiError(400, 'blockId requerido');

    const round = await SurveyRound.findOne({
      where: { userId: req.user.id, blockId, isActive: true },
      include: [blockInclude()],
    });

    res.json(round || null);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const round = await SurveyRound.findByPk(req.params.id, {
      include: [
        blockInclude(),
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: Visit,
          as: 'visits',
          include: [{ model: HygieneObservation, as: 'hygieneObservation' }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!round) throw new ApiError(404, 'Relevamiento no encontrado');

    if (req.user.role === 'recorredor' && round.userId !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (
      req.user.role === 'coordinador' &&
      round.block.communeId !== req.user.communeId
    ) {
      throw new ApiError(403, 'No tenés permisos');
    }

    res.json(round);
  } catch (err) {
    next(err);
  }
}

async function close(req, res, next) {
  try {
    const round = await SurveyRound.findByPk(req.params.id);
    if (!round) throw new ApiError(404, 'Relevamiento no encontrado');
    if (req.user.role === 'recorredor' && round.userId !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (!round.isActive) throw new ApiError(400, 'El relevamiento ya está cerrado');

    await round.update({
      isActive: false,
      finishedAt: new Date(),
      notes: req.validated?.notes ?? round.notes,
    });

    res.json(round);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const where = {};
    if (req.user.role === 'recorredor') {
      where.userId = req.user.id;
    } else if (req.query.userId) {
      where.userId = req.query.userId;
    }
    if (req.query.blockId) where.blockId = req.query.blockId;
    if (req.query.active === 'true') where.isActive = true;

    const rounds = await SurveyRound.findAll({
      where,
      include: [
        blockInclude(),
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['startedAt', 'DESC']],
    });

    res.json(rounds);
  } catch (err) {
    next(err);
  }
}

module.exports = { start, active, getById, close, list };
