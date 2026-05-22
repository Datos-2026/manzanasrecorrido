'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('visits', 'street', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('visits', 'streetNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('visits', 'doorbell', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('visits', 'surveyData', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('visits', 'surveyData');
    await queryInterface.removeColumn('visits', 'doorbell');
    await queryInterface.removeColumn('visits', 'streetNumber');
    await queryInterface.removeColumn('visits', 'street');
  },
};
