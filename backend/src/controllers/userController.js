const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Commune } = require('../models');
const ApiError = require('../utils/ApiError');
const { getUserCommuneIds, isAllowedCommune } = require('../utils/communeAccess');

const userInclude = [
  { model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] },
  {
    model: Commune,
    as: 'communes',
    attributes: ['id', 'name', 'code'],
    through: { attributes: [] },
  },
];

function normalizeCommuneIds(data, fallback = []) {
  let ids = Array.isArray(data.communeIds) ? data.communeIds : null;
  if (!ids && data.communeId) ids = [data.communeId];
  if (!ids) ids = fallback;
  return [...new Set(ids)];
}

async function applyCommunes(user, communeIds, transaction) {
  await user.setCommunes(communeIds || [], { transaction });
  if (communeIds && communeIds.length) {
    await user.update({ communeId: communeIds[0] }, { transaction });
  } else {
    await user.update({ communeId: null }, { transaction });
  }
}

async function list(req, res, next) {
  try {
    const where = {};
    let include = userInclude;

    if (req.user.role === 'coordinador') {
      const allowedIds = getUserCommuneIds(req.user);
      include = [
        { model: Commune, as: 'commune', attributes: ['id', 'name', 'code'] },
        {
          model: Commune,
          as: 'communes',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] },
          where: { id: { [Op.in]: allowedIds } },
          required: true,
        },
      ];
    } else if (req.user.role !== 'admin') {
      throw new ApiError(403, 'No tenés permisos');
    }

    const users = await User.findAll({
      where,
      include,
      order: [['lastName', 'ASC']],
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, { include: userInclude });
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador') {
      const allowedIds = getUserCommuneIds(req.user);
      const userIds = (user.communes || []).map((c) => c.id);
      if (!userIds.some((id) => allowedIds.includes(id))) {
        throw new ApiError(403, 'No tenés permisos');
      }
    }
    if (req.user.role === 'recorredor' && req.params.id !== req.user.id) {
      throw new ApiError(403, 'No tenés permisos');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction();
  try {
    const data = req.validated;
    let communeIds = normalizeCommuneIds(data);

    if (req.user.role === 'coordinador') {
      if (data.role === 'admin') throw new ApiError(403, 'No podés crear administradores');
      const allowedIds = getUserCommuneIds(req.user);
      // forzamos a que las comunas asignadas sean SOLO de su jurisdicción
      communeIds = communeIds.filter((id) => allowedIds.includes(id));
      if (communeIds.length === 0) communeIds = [allowedIds[0]];
    }

    if (data.role !== 'admin' && communeIds.length === 0) {
      throw new ApiError(400, 'Los usuarios no admin deben tener al menos una comuna asignada');
    }

    if (data.role === 'admin') communeIds = [];

    const existing = await User.scope('withPassword').findOne({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'El email ya está registrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role,
        communeId: communeIds[0] || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      { transaction: t }
    );

    if (communeIds.length) {
      await user.setCommunes(communeIds, { transaction: t });
    }

    await t.commit();

    const fresh = await User.findByPk(user.id, { include: userInclude });
    res.status(201).json(fresh);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function update(req, res, next) {
  const { sequelize } = require('../models');
  const t = await sequelize.transaction();
  try {
    const user = await User.scope('withPassword').findByPk(req.params.id, {
      include: [
        {
          model: Commune,
          as: 'communes',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador') {
      const allowedIds = getUserCommuneIds(req.user);
      const userIds = (user.communes || []).map((c) => c.id);
      if (!userIds.some((id) => allowedIds.includes(id))) {
        throw new ApiError(403, 'No tenés permisos');
      }
      if (req.validated.role === 'admin') throw new ApiError(403, 'No podés asignar rol admin');
    }

    const data = { ...req.validated };
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    let communeIdsProvided = Array.isArray(data.communeIds) || !!data.communeId;
    let communeIds = communeIdsProvided
      ? normalizeCommuneIds(data, (user.communes || []).map((c) => c.id))
      : null;

    if (communeIds && req.user.role === 'coordinador') {
      const allowedIds = getUserCommuneIds(req.user);
      const currentUserIds = (user.communes || []).map((c) => c.id);
      // mantiene las comunas fuera de jurisdicción que ya tenía y filtra agregados a las suyas
      communeIds = [
        ...new Set([
          ...communeIds.filter((id) => allowedIds.includes(id)),
          ...currentUserIds.filter((id) => !allowedIds.includes(id)),
        ]),
      ];
    }

    if ((data.role && data.role === 'admin')) {
      communeIds = [];
    }

    delete data.communeIds;
    if (communeIds && communeIds.length) {
      data.communeId = communeIds[0];
    } else if (communeIds && communeIds.length === 0) {
      data.communeId = null;
    }

    await user.update(data, { transaction: t });

    if (communeIds !== null) {
      await user.setCommunes(communeIds, { transaction: t });
    }

    await t.commit();

    const fresh = await User.findByPk(user.id, { include: userInclude });
    res.json(fresh);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Commune,
          as: 'communes',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });
    if (!user) throw new ApiError(404, 'Usuario no encontrado');

    if (req.user.role === 'coordinador') {
      const allowedIds = getUserCommuneIds(req.user);
      const userIds = (user.communes || []).map((c) => c.id);
      if (!userIds.some((id) => allowedIds.includes(id))) {
        throw new ApiError(403, 'No tenés permisos');
      }
    }

    await user.update({ isActive: false });
    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
