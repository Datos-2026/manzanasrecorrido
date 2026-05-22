'use strict';

/**
 * Renombra el valor del enum users.role de 'recorridor' a 'recorredor'
 * y actualiza email/lastName del usuario seed si todavía tiene el viejo.
 *
 * Es idempotente: si el rename ya pasó, igual completa la actualización
 * de datos sin romper.
 *
 * PostgreSQL 10+ permite ALTER TYPE ... RENAME VALUE.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    // Rename del valor en el enum solo si aplica.
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'recorridor'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'recorredor'
        ) THEN
          ALTER TYPE "enum_users_role" RENAME VALUE 'recorridor' TO 'recorredor';
        END IF;
      END$$;
    `);

    // Pasar a 'recorredor' si todavía quedó alguno con el valor viejo
    // (caso poco probable, pero por las dudas — usamos cast a text para no
    // tropezar con el enum).
    await sequelize.query(`
      UPDATE users SET role = 'recorredor'
      WHERE role::text = 'recorridor';
    `);

    // Actualizar datos del usuario de seed.
    await sequelize.query(`
      UPDATE users
      SET email = 'recorredor@test.com'
      WHERE email = 'recorridor@test.com';
    `);

    await sequelize.query(`
      UPDATE users
      SET "lastName" = 'Recorredor'
      WHERE "lastName" = 'Recorridor';
    `);
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'recorredor'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'recorridor'
        ) THEN
          ALTER TYPE "enum_users_role" RENAME VALUE 'recorredor' TO 'recorridor';
        END IF;
      END$$;
    `);

    await sequelize.query(`
      UPDATE users SET role = 'recorridor'
      WHERE role::text = 'recorredor';
    `);

    await sequelize.query(`
      UPDATE users
      SET email = 'recorridor@test.com'
      WHERE email = 'recorredor@test.com';
    `);

    await sequelize.query(`
      UPDATE users
      SET "lastName" = 'Recorridor'
      WHERE "lastName" = 'Recorredor';
    `);
  },
};
