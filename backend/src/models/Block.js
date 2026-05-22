const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Block = sequelize.define(
    'Block',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      communeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      neighborhood: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      polygon: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      centroidLat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      centroidLng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'blocks',
      timestamps: true,
    }
  );

  return Block;
};
