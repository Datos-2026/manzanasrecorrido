const sequelize = require('../config/database');
const Commune = require('./Commune')(sequelize);
const User = require('./User')(sequelize);
const Block = require('./Block')(sequelize);
const BlockAssignment = require('./BlockAssignment')(sequelize);
const Visit = require('./Visit')(sequelize);
const HygieneObservation = require('./HygieneObservation')(sequelize);
const SurveyRound = require('./SurveyRound')(sequelize);

// Commune associations
Commune.hasMany(User, { foreignKey: 'communeId', as: 'users' });
User.belongsTo(Commune, { foreignKey: 'communeId', as: 'commune' });

User.belongsToMany(Commune, {
  through: 'user_communes',
  as: 'communes',
  foreignKey: 'userId',
  otherKey: 'communeId',
  timestamps: true,
});
Commune.belongsToMany(User, {
  through: 'user_communes',
  as: 'assignedUsers',
  foreignKey: 'communeId',
  otherKey: 'userId',
  timestamps: true,
});

Commune.hasMany(Block, { foreignKey: 'communeId', as: 'blocks' });
Block.belongsTo(Commune, { foreignKey: 'communeId', as: 'commune' });

// Block assignments
User.hasMany(BlockAssignment, { foreignKey: 'userId', as: 'assignments' });
BlockAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Block.hasMany(BlockAssignment, { foreignKey: 'blockId', as: 'assignments' });
BlockAssignment.belongsTo(Block, { foreignKey: 'blockId', as: 'block' });

User.hasMany(BlockAssignment, { foreignKey: 'assignedBy', as: 'assignmentsMade' });
BlockAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });

// Visits
User.hasMany(Visit, { foreignKey: 'userId', as: 'visits' });
Visit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Block.hasMany(Visit, { foreignKey: 'blockId', as: 'visits' });
Visit.belongsTo(Block, { foreignKey: 'blockId', as: 'block' });

// Hygiene observations
Visit.hasOne(HygieneObservation, { foreignKey: 'visitId', as: 'hygieneObservation' });
HygieneObservation.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

// Survey rounds
User.hasMany(SurveyRound, { foreignKey: 'userId', as: 'surveyRounds' });
SurveyRound.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Block.hasMany(SurveyRound, { foreignKey: 'blockId', as: 'surveyRounds' });
SurveyRound.belongsTo(Block, { foreignKey: 'blockId', as: 'block' });

SurveyRound.hasMany(Visit, { foreignKey: 'surveyRoundId', as: 'visits' });
Visit.belongsTo(SurveyRound, { foreignKey: 'surveyRoundId', as: 'surveyRound' });

module.exports = {
  sequelize,
  Commune,
  User,
  Block,
  BlockAssignment,
  Visit,
  HygieneObservation,
  SurveyRound,
};
