const { Op } = require('sequelize');
const {
  BlockAssignment,
  Block,
  Visit,
  User,
  HygieneObservation,
  Commune,
} = require('../models');
const { getWeekStart, getWeekEnd, formatDateISO, parseDateOnly } = require('../utils/dates');

function buildActiveAssignmentWhere(weekStartStr, weekEndStr) {
  return {
    isActive: true,
    startDate: { [Op.lte]: weekEndStr },
    [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: weekStartStr } }],
  };
}

function normalizeCommuneIds(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value.length ? value : null;
  return [value];
}

async function getWeeklyDashboard({ weekStart: weekStartParam, communeIds }) {
  const weekStartDate = weekStartParam ? parseDateOnly(weekStartParam) : getWeekStart();
  const weekEndDate = getWeekEnd(weekStartDate);
  const weekStartStr = formatDateISO(weekStartDate);
  const weekEndStr = formatDateISO(weekEndDate);

  const ids = normalizeCommuneIds(communeIds);
  const assignmentWhere = buildActiveAssignmentWhere(weekStartStr, weekEndStr);

  const blockWhere = {};
  if (ids) blockWhere.communeId = { [Op.in]: ids };

  const assignments = await BlockAssignment.findAll({
    where: assignmentWhere,
    include: [
      {
        model: Block,
        as: 'block',
        where: Object.keys(blockWhere).length ? blockWhere : undefined,
        required: true,
        include: [{ model: Commune, as: 'commune', attributes: ['id', 'name'] }],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'communeId'],
      },
    ],
  });

  const blockIds = [...new Set(assignments.map((a) => a.blockId))];

  const visits = blockIds.length
    ? await Visit.findAll({
        where: {
          blockId: { [Op.in]: blockIds },
          visitDate: { [Op.between]: [weekStartStr, weekEndStr] },
        },
        include: [
          { model: HygieneObservation, as: 'hygieneObservation' },
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
          { model: Block, as: 'block', attributes: ['id', 'code', 'communeId'] },
        ],
        order: [['visitDate', 'DESC']],
      })
    : [];

  const visitedBlockIds = new Set(visits.map((v) => v.blockId));
  const assignedBlocks = blockIds.length;
  const visitedBlocks = visitedBlockIds.size;
  const pendingBlocks = Math.max(0, assignedBlocks - visitedBlocks);
  const coveragePercentage =
    assignedBlocks > 0 ? Math.round((visitedBlocks / assignedBlocks) * 1000) / 10 : 0;

  const byUserMap = {};
  for (const a of assignments) {
    const uid = a.userId;
    if (!byUserMap[uid]) {
      byUserMap[uid] = {
        userId: uid,
        name: `${a.user.firstName} ${a.user.lastName}`,
        assignedBlockIds: new Set(),
        visitedBlockIds: new Set(),
      };
    }
    byUserMap[uid].assignedBlockIds.add(a.blockId);
    if (visitedBlockIds.has(a.blockId)) {
      byUserMap[uid].visitedBlockIds.add(a.blockId);
    }
  }

  const byUser = Object.values(byUserMap).map((u) => {
    const assigned = u.assignedBlockIds.size;
    const visited = u.visitedBlockIds.size;
    const pending = assigned - visited;
    return {
      userId: u.userId,
      name: u.name,
      assignedBlocks: assigned,
      visitedBlocks: visited,
      pendingBlocks: pending,
      coveragePercentage: assigned > 0 ? Math.round((visited / assigned) * 1000) / 10 : 0,
    };
  });

  const lastVisitByBlock = {};
  for (const v of visits) {
    if (!lastVisitByBlock[v.blockId]) {
      lastVisitByBlock[v.blockId] = v;
    }
  }

  const assignmentByBlock = {};
  for (const a of assignments) {
    if (!assignmentByBlock[a.blockId]) {
      assignmentByBlock[a.blockId] = a;
    }
  }

  const byBlock = blockIds.map((blockId) => {
    const assignment = assignmentByBlock[blockId];
    const lastVisit = lastVisitByBlock[blockId];
    const visited = visitedBlockIds.has(blockId);
    return {
      blockId,
      code: assignment.block.code,
      assignedTo: `${assignment.user.firstName} ${assignment.user.lastName}`,
      visited,
      lastVisitDate: lastVisit ? lastVisit.visitDate : null,
      hasCriticalPoint: lastVisit?.hygieneObservation?.criticalPoint || false,
    };
  });

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    assignedBlocks,
    visitedBlocks,
    pendingBlocks,
    coveragePercentage,
    byUser,
    byBlock,
  };
}

async function getSummary(communeIds = null) {
  const now = new Date();
  const monthStart = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const ids = normalizeCommuneIds(communeIds);
  const inFilter = ids ? { [Op.in]: ids } : null;

  const userWhere = { isActive: true, role: { [Op.ne]: 'admin' } };
  const blockWhere = { isActive: true };

  if (inFilter) {
    userWhere.communeId = inFilter;
    blockWhere.communeId = inFilter;
  }

  const activeUsers = await User.count({ where: userWhere });
  const totalBlocks = await Block.count({ where: blockWhere });

  const assignmentsWithBlocks = await BlockAssignment.findAll({
    where: { isActive: true },
    attributes: ['blockId'],
    include: [
      {
        model: Block,
        as: 'block',
        where: inFilter ? { communeId: inFilter, isActive: true } : { isActive: true },
        required: true,
        attributes: ['id'],
      },
    ],
  });
  const assignedBlockIds = new Set(assignmentsWithBlocks.map((a) => a.blockId));
  const assignedBlocksCount = assignedBlockIds.size;
  const activeAssignments = assignmentsWithBlocks.length;
  const assignmentCoveragePercentage =
    totalBlocks > 0
      ? Math.round((assignedBlocksCount / totalBlocks) * 1000) / 10
      : 0;

  const visitsThisMonth = await Visit.count({
    where: { visitDate: { [Op.between]: [monthStart, monthEnd] } },
    include: inFilter
      ? [{ model: Block, as: 'block', where: { communeId: inFilter }, required: true }]
      : [],
  });

  const criticalPoints = await HygieneObservation.count({
    where: { criticalPoint: true },
    include: [
      {
        model: Visit,
        as: 'visit',
        required: true,
        include: inFilter
          ? [{ model: Block, as: 'block', where: { communeId: inFilter }, required: true }]
          : [],
      },
    ],
  });

  return {
    activeUsers,
    activeBlocks: totalBlocks,
    totalBlocks,
    assignedBlocks: assignedBlocksCount,
    unassignedBlocks: Math.max(0, totalBlocks - assignedBlocksCount),
    assignmentCoveragePercentage,
    activeAssignments,
    visitsThisMonth,
    criticalPoints,
  };
}

module.exports = { getWeeklyDashboard, getSummary };
