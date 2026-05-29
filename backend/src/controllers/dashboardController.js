const dashboardService = require('../services/dashboardService');
const ApiError = require('../utils/ApiError');
const { getUserCommuneIds } = require('../utils/communeAccess');

function getCommuneIdsFromQueryOrUser(req) {
  if (req.user.role === 'coordinador') {
    return getUserCommuneIds(req.user);
  }
  if (req.query.communeId) return [req.query.communeId];
  if (req.query.communeIds) {
    return Array.isArray(req.query.communeIds)
      ? req.query.communeIds
      : String(req.query.communeIds)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
  }
  return null;
}

async function weekly(req, res, next) {
  try {
    if (req.user.role === 'recorredor') {
      throw new ApiError(403, 'No tenés permisos para ver el dashboard');
    }

    const communeIds = getCommuneIdsFromQueryOrUser(req);

    const data = await dashboardService.getWeeklyDashboard({
      weekStart: req.query.weekStart,
      communeIds,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    if (req.user.role === 'recorredor') {
      throw new ApiError(403, 'No tenés permisos');
    }

    const communeIds = getCommuneIdsFromQueryOrUser(req);
    const data = await dashboardService.getSummary(communeIds);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { weekly, summary };
