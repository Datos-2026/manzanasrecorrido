'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_communes', {
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      communeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'communes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE user_communes ADD CONSTRAINT user_communes_pkey PRIMARY KEY ("userId", "communeId");'
    );

    await queryInterface.addIndex('user_communes', { name: 'user_communes_user_idx', fields: ['userId'] });
    await queryInterface.addIndex('user_communes', { name: 'user_communes_commune_idx', fields: ['communeId'] });

    await queryInterface.sequelize.query(
      `INSERT INTO user_communes ("userId", "communeId", "createdAt", "updatedAt")
       SELECT id, "communeId", NOW(), NOW() FROM users WHERE "communeId" IS NOT NULL
       ON CONFLICT DO NOTHING;`
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_communes');
  },
};
