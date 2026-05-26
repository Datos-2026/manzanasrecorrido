'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('survey_rounds', {
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
      weekNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      finishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX survey_rounds_active_user_block_idx ON survey_rounds ("userId", "blockId") WHERE "isActive" = true;'
    );

    await queryInterface.addIndex('survey_rounds', {
      name: 'survey_rounds_block_week_idx',
      fields: ['blockId', 'weekNumber'],
    });

    await queryInterface.addColumn('visits', 'surveyRoundId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'survey_rounds', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('visits', {
      name: 'visits_survey_round_idx',
      fields: ['surveyRoundId'],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('visits', 'visits_survey_round_idx');
    await queryInterface.removeColumn('visits', 'surveyRoundId');
    await queryInterface.dropTable('survey_rounds');
  },
};
