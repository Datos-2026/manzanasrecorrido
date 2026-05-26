const { Op } = require('sequelize');
const {
  sequelize,
  Visit,
  Block,
  User,
  HygieneObservation,
  Commune,
  SurveyRound,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { hasActiveAssignment } = require('../services/assignmentService');

async function list(req, res, next) {
  try {
    const { userId, blockId, communeId, dateFrom, dateTo } = req.query;
    const where = {};
    const blockWhere = {};

    if (req.user.role === 'recorredor') {
      where.userId = req.user.id;
    } else if (req.user.role === 'coordinador') {
      blockWhere.communeId = req.user.communeId;
    } else if (communeId) {
      blockWhere.communeId = communeId;
    }

    if (userId && req.user.role !== 'recorredor') where.userId = userId;
    if (blockId) where.blockId = blockId;
    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) where.visitDate[Op.gte] = dateFrom;
      if (dateTo) where.visitDate[Op.lte] = dateTo;
    }

    const visits = await Visit.findAll({
      where,
      include: [
        { model: HygieneObservation, as: 'hygieneObservation' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: Block,
          as: 'block',
          where: Object.keys(blockWhere).length ? blockWhere : undefined,
          required: Object.keys(blockWhere).length > 0,
          include: [{ model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] }],
        },
      ],
      order: [['visitDate', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json(visits);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const visit = await Visit.findByPk(req.params.id, {
      include: [
        { model: HygieneObservation, as: 'hygieneObservation' },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
        { model: Block, as: 'block', include: [{ model: Commune, as: 'commune' }] },
      ],
    });
    if (!visit) throw new ApiError(404, 'Recorrido no encontrado');

    if (req.user.role === 'recorredor' && visit.userId !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (req.user.role === 'coordinador' && visit.block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    res.json(visit);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const data = req.validated;
    const userId = req.user.id;

    if (req.user.role === 'recorredor') {
      const assigned = await hasActiveAssignment(userId, data.blockId);
      if (!assigned) {
        throw new ApiError(403, 'No tenés asignación activa para esta manzana');
      }
    }

    const block = await Block.findByPk(data.blockId);
    if (!block) throw new ApiError(404, 'Manzana no encontrada');

    if (req.user.role === 'coordinador' && block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    const { hygieneObservation, ...visitData } = data;

    if (visitData.surveyRoundId) {
      const round = await SurveyRound.findByPk(visitData.surveyRoundId);
      if (!round) throw new ApiError(404, 'Relevamiento no encontrado');
      if (req.user.role === 'recorredor' && round.userId !== req.user.id) {
        throw new ApiError(403, 'No tenés permisos sobre este relevamiento');
      }
      if (!round.isActive) {
        throw new ApiError(400, 'El relevamiento ya está cerrado, no se pueden agregar domicilios');
      }
      if (round.blockId !== visitData.blockId) {
        throw new ApiError(400, 'El relevamiento no corresponde a esta manzana');
      }
      visitData.weekNumber = round.weekNumber;
    }

    const visit = await Visit.create(
      { ...visitData, userId },
      { transaction: t }
    );

    if (hygieneObservation) {
      await HygieneObservation.create(
        { ...hygieneObservation, visitId: visit.id },
        { transaction: t }
      );
    }

    await t.commit();

    const full = await Visit.findByPk(visit.id, {
      include: [
        { model: HygieneObservation, as: 'hygieneObservation' },
        { model: Block, as: 'block' },
      ],
    });

    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function update(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const visit = await Visit.findByPk(req.params.id, {
      include: [
        { model: HygieneObservation, as: 'hygieneObservation' },
        { model: Block, as: 'block' },
      ],
    });
    if (!visit) throw new ApiError(404, 'Recorrido no encontrado');

    if (req.user.role === 'recorredor' && visit.userId !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (req.user.role === 'coordinador' && visit.block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    const { hygieneObservation, ...visitData } = req.validated;
    await visit.update(visitData, { transaction: t });

    if (hygieneObservation) {
      if (visit.hygieneObservation) {
        await visit.hygieneObservation.update(hygieneObservation, { transaction: t });
      } else {
        await HygieneObservation.create(
          { ...hygieneObservation, visitId: visit.id },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const full = await Visit.findByPk(visit.id, {
      include: [{ model: HygieneObservation, as: 'hygieneObservation' }, { model: Block, as: 'block' }],
    });
    res.json(full);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const visit = await Visit.findByPk(req.params.id, {
      include: [{ model: Block, as: 'block' }],
    });
    if (!visit) throw new ApiError(404, 'Recorrido no encontrado');

    if (req.user.role === 'recorredor' && visit.userId !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }
    if (req.user.role === 'coordinador' && visit.block.communeId !== req.user.communeId) {
      throw new ApiError(403, 'No tenés permisos');
    }

    await visit.destroy();
    res.json({ message: 'Recorrido eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
