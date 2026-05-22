'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('blocks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      communeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      label: { type: Sequelize.STRING, allowNull: true },
      neighborhood: { type: Sequelize.STRING, allowNull: true },
      polygon: { type: Sequelize.JSONB, allowNull: true },
      centroidLat: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      centroidLng: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('blocks');
  },
};
