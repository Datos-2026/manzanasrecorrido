const { Op } = require('sequelize');
const { formatDateISO } = require('../utils/dates');
const {
  sequelize,
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
} = require('../services/assignmentService');
const { getUserCommuneIds, isAllowedCommune } = require('../utils/communeAccess');
const { centroidFromGeometry } = require('../utils/geo');

async function list(req, res, next) {
  try {
    const where = {};
    const blockInclude = { model: Block, as: 'block', include: [{ model: Commune, as: 'commune' }] };

    if (req.user.role === 'coordinador') {
      blockInclude.where = { communeId: { [Op.in]: getUserCommuneIds(req.user) } };
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

async function assertUserInCommuneScope(req, targetUser, communeId) {
  if (req.user.role !== 'coordinador') return;

  const allowedIds = getUserCommuneIds(req.user);
  if (!allowedIds.includes(communeId)) {
    throw new ApiError(403, 'La manzana no pertenece a tus comunas');
  }

  const targetCommunes = (await targetUser.getCommunes?.()) || [];
  const targetIds = targetCommunes.map((c) => c.id);
  if (targetUser.communeId && !targetIds.includes(targetUser.communeId)) {
    targetIds.push(targetUser.communeId);
  }
  const overlap = targetIds.some((id) => allowedIds.includes(id));
  if (!overlap) {
    throw new ApiError(403, 'El usuario no pertenece a tus comunas');
  }
}

async function upsertBlockFromCadastral(cadastral, transaction) {
  const commune = await Commune.findByPk(cadastral.communeId, { transaction });
  if (!commune) throw new ApiError(404, 'Comuna no encontrada');

  const code = String(cadastral.code).trim();
  const centroid = centroidFromGeometry(cadastral.geometry);
  if (!centroid) throw new ApiError(400, 'Geometría de manzana inválida');

  let block = await Block.findOne({ where: { code }, transaction });

  const payload = {
    code,
    communeId: cadastral.communeId,
    label: cadastral.label || code,
    neighborhood: cadastral.neighborhood || commune.name,
    polygon: cadastral.geometry,
    centroidLat: centroid.lat,
    centroidLng: centroid.lng,
    isActive: true,
  };

  if (block) {
    await block.update(payload, { transaction });
  } else {
    block = await Block.create(payload, { transaction });
  }

  return block;
}

async function create(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { userId, blockId, startDate, endDate, cadastral } = req.validated;

    const targetUser = await User.findByPk(userId, { transaction: t });
    if (!targetUser) throw new ApiError(404, 'Usuario no encontrado');

    let block;
    if (cadastral) {
      if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, cadastral.communeId)) {
        throw new ApiError(403, 'No podés asignar manzanas fuera de tus comunas');
      }
      block = await upsertBlockFromCadastral(cadastral, t);
    } else {
      block = await Block.findByPk(blockId, { transaction: t });
      if (!block) throw new ApiError(404, 'Manzana no encontrada');
    }

    await assertUserInCommuneScope(req, targetUser, block.communeId);
    await ensureNoDuplicateActive(userId, block.id);

    const assignment = await BlockAssignment.create(
      {
        userId,
        blockId: block.id,
        assignedBy: req.user.id,
        startDate,
        endDate: endDate || null,
        isActive: true,
      },
      { transaction: t }
    );

    await t.commit();

    const full = await BlockAssignment.findByPk(assignment.id, {
      include: [
        { model: Block, as: 'block', include: [{ model: Commune, as: 'commune' }] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
      ],
    });

    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const assignment = await BlockAssignment.findByPk(req.params.id, {
      include: [{ model: Block, as: 'block' }],
    });
    if (!assignment) throw new ApiError(404, 'Asignación no encontrada');

    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, assignment.block.communeId)) {
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

    if (req.user.role === 'coordinador' && !isAllowedCommune(req.user, assignment.block.communeId)) {
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
