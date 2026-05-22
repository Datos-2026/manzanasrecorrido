const dashboardService = require('../services/dashboardService');
const ApiError = require('../utils/ApiError');

async function weekly(req, res, next) {
  try {
    let communeId = req.query.communeId || null;

    if (req.user.role === 'coordinador') {
      communeId = req.user.communeId;
    } else if (req.user.role === 'recorridor') {
      throw new ApiError(403, 'No tenés permisos para ver el dashboard');
    }

    const data = await dashboardService.getWeeklyDashboard({
      weekStart: req.query.weekStart,
      communeId,
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    let communeId = null;

    if (req.user.role === 'coordinador') {
      communeId = req.user.communeId;
    } else if (req.user.role === 'recorridor') {
      throw new ApiError(403, 'No tenés permisos');
    } else if (req.query.communeId) {
      communeId = req.query.communeId;
    }

    const data = await dashboardService.getSummary(communeId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { weekly, summary };
