'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('visits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      blockId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'blocks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      visitDate: { type: Sequelize.DATEONLY, allowNull: false },
      startTime: { type: Sequelize.TIME, allowNull: true },
      endTime: { type: Sequelize.TIME, allowNull: true },
      status: {
        type: Sequelize.ENUM('realizado', 'no_realizado', 'parcial'),
        allowNull: false,
      },
      couldVisit: { type: Sequelize.BOOLEAN, defaultValue: true },
      reasonNotVisited: { type: Sequelize.TEXT, allowNull: true },
      generalNotes: { type: Sequelize.TEXT, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('visits');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_visits_status";');
  },
};
