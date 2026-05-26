const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Visit = sequelize.define(
    'Visit',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      blockId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      visitDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('realizado', 'no_realizado', 'parcial'),
        allowNull: false,
      },
      couldVisit: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      reasonNotVisited: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      generalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      street: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      streetNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      doorbell: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      surveyData: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      weekNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      surveyRoundId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'visits',
      timestamps: true,
    }
  );

  return Visit;
};
