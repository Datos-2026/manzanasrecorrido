const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HygieneObservation = sequelize.define(
    'HygieneObservation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      visitId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      trashProperlyDisposed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      trashOutOfSchedule: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      bulkyWaste: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      rubble: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      overflowingContainers: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      criticalPoint: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      criticalPointDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      photos: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'hygiene_observations',
      timestamps: true,
    }
  );

  return HygieneObservation;
};
