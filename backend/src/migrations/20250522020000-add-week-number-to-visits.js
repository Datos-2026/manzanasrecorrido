'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('visits', 'weekNumber', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('visits', {
      name: 'visits_block_week_idx',
      fields: ['blockId', 'weekNumber'],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('visits', 'visits_block_week_idx');
    await queryInterface.removeColumn('visits', 'weekNumber');
  },
};
