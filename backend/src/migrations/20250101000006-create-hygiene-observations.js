'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hygiene_observations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      visitId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'visits', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      trashProperlyDisposed: { type: Sequelize.BOOLEAN, allowNull: true },
      trashOutOfSchedule: { type: Sequelize.BOOLEAN, allowNull: true },
      bulkyWaste: { type: Sequelize.BOOLEAN, allowNull: true },
      rubble: { type: Sequelize.BOOLEAN, allowNull: true },
      overflowingContainers: { type: Sequelize.BOOLEAN, allowNull: true },
      criticalPoint: { type: Sequelize.BOOLEAN, allowNull: true },
      criticalPointDescription: { type: Sequelize.TEXT, allowNull: true },
      photos: { type: Sequelize.JSONB, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hygiene_observations');
  },
};
