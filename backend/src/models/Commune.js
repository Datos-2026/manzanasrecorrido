const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Commune = sequelize.define(
    'Commune',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'communes',
      timestamps: true,
    }
  );

  return Commune;
};
