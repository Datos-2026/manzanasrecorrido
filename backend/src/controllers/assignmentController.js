const { formatDateISO } = require('../utils/dates');
const {
  BlockAssignment,
  Block,
  User,
  Commune,
  Visit,
  SurveyRound,
} = require('../models');
const ApiError = require('../utils/ApiError');
const {
  ensureNoDuplicateActive,
  validateBlockInCommune,
} = require('../services/assignmentService');

async function list(req, res, next) {
  try {
    const where = {};
    const blockInclude = { model: Block, as: 'block', include: [{ model: Commune, as: 'commune' }] };

    if (req.user.role === 'coordinador') {
      blockInclude.where = { communeId: req.user.communeId };
      blockInclude.required = true;
    }

    if (req.query.active === 'true') where.isActive = true;
    if (req.query.userId) where.userId = req.query.userId;

    const assignments = await BlockAssignment.findAll({
      where,
      include: [
        blockInclude,
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(assignments);
  } catch (err) {
    next(err);
  }
}

async function myBlocks(req, res, next) {
  try {
    const assignments = await BlockAssignment.findAll({
      where: { userId: req.user.id, isActive: true },
      include: [
        { model: Block, as: 'block', include: [{ model: Commune, as: 'commune' }] },
      ],
      order: [[{ model: Block, as: 'block' }, 'code', 'ASC']],
    });

    const blockIds = assignments.map((a) => a.blockId);

    const [visits, activeRounds, finishedRounds] = blockIds.length
      ? await Promise.all([
          Visit.findAll({
            where: { blockId: blockIds, userId: req.user.id },
            attributes: ['id', 'blockId', 'weekNumber', 'visitDate', 'createdAt'],
            order: [['createdAt', 'DESC']],
          }),
          SurveyRound.findAll({
            where: { blockId: blockIds, userId: req.user.id, isActive: true },
          }),
          SurveyRound.findAll({
            where: { blockId: blockIds, userId: req.user.id, isActive: false },
            attributes: ['blockId', 'weekNumber'],
          }),
        ])
      : [[], [], []];

    const visitsByBlock = {};
    visits.forEach((v) => {
      const list = visitsByBlock[v.blockId] || (visitsByBlock[v.blockId] = []);
      list.push(v);
    });

    const activeByBlock = {};
    activeRounds.forEach((r) => {
      activeByBlock[r.blockId] = r;
    });

    const completedWeeksByBlock = {};
    finishedRounds.forEach((r) => {
      const set = completedWeeksByBlock[r.blockId] || (completedWeeksByBlock[r.blockId] = new Set());
      set.add(r.weekNumber);
    });

    const blocks = assignments.map((a) => {
      const blockVisits = visitsByBlock[a.blockId] || [];
      const activeRound = activeByBlock[a.blockId] || null;
      const completedWeeks = completedWeeksByBlock[a.blockId]
        ? [...completedWeeksByBlock[a.blockId]].sort((x, y) => x - y)
        : [];

      const maxCompletedWeek = completedWeeks.length ? Math.max(...completedWeeks) : 0;
      const nextWeekNumber = Math.min(5, maxCompletedWeek + 1);
      const lastVisit = blockVisits[0] || null;

      return {
        assignmentId: a.id,
        startDate: a.startDate,
        ...a.block.toJSON(),
        visitsCount: blockVisits.length,
        lastVisitDate: lastVisit ? lastVisit.visitDate : null,
        completedWeeks,
        currentMaxWeek: maxCompletedWeek,
        nextWeekNumber,
        completed: maxCompletedWeek >= 5,
        activeRound: activeRound
          ? {
              id: activeRound.id,
              weekNumber: activeRound.weekNumber,
              startedAt: activeRound.startedAt,
            }
          : null,
      };
    });

    res.json(blocks);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { userId, blockId, startDate, endDate } = req.validated;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) throw new ApiError(404, 'Usuario no encontrado');

    const block = await Block.findByPk(blockId);
    if (!block) throw new ApiError(404, 'Manzana no encontrada');

    if (req.user.role === 'coordinador') {
      if (block.communeId !== req.user.communeId) {
        throw new ApiError(403, 'La manzana no pertenece a tu comuna');
      }
      if (targetUser.communeId !== req.user.communeId) {
        throw new ApiError(403, 'El usuario no pertenece a tu comuna');
      }
    }

    await ensureNoDuplicateActive(userId, blockId);

    const assignment = await BlockAssignment.create({
      userId,
      blockId,
      assignedBy: req.user.id,
      startDate,
      endDate: endDate || null,
      isActive: true,
    });

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const assignment = await BlockAssignment.findByPk(req.params.id, {
      include: [{ model: Block, as: 'block' }],
    });
    if (!assignment) throw new ApiError(404, 'Asignación no encontrada');

    if (req.user.role === 'coordinador' && assignment.block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await assignment.update(req.validated);
    res.json(assignment);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const assignment = await BlockAssignment.findByPk(req.params.id, {
      include: [{ model: Block, as: 'block' }],
    });
    if (!assignment) throw new ApiError(404, 'Asignación no encontrada');

    if (req.user.role === 'coordinador' && assignment.block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await assignment.update({
      isActive: false,
      endDate: formatDateISO(new Date()),
    });

    res.json({ message: 'Asignación desactivada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, myBlocks, create, update, remove };
