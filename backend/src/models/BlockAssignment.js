const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlockAssignment = sequelize.define(
    'BlockAssignment',
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
      assignedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'block_assignments',
      timestamps: true,
    }
  );

  return BlockAssignment;
};
