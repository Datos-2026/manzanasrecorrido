'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const { QueryTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      "SELECT id FROM communes WHERE code = 'C2' LIMIT 1",
      { type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      console.log('Seed: datos demo ya existen, se omite.');
      return;
    }

    const now = new Date();
    const communeId = randomUUID();
    const adminId = randomUUID();
    const coordinadorId = randomUUID();
    const recorredorId = randomUUID();

    const passwordHash = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('communes', [
      {
        id: communeId,
        name: 'Comuna 2',
        code: 'C2',
        description: 'Comuna 2 - Recorridos territoriales',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@test.com',
        phone: null,
        passwordHash,
        role: 'admin',
        communeId: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: coordinadorId,
        firstName: 'María',
        lastName: 'Coordinadora',
        email: 'coordinador@test.com',
        phone: '1111111111',
        passwordHash,
        role: 'coordinador',
        communeId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: recorredorId,
        firstName: 'Juan',
        lastName: 'Recorredor',
        email: 'recorredor@test.com',
        phone: '2222222222',
        passwordHash,
        role: 'recorredor',
        communeId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const blockIds = [];
    const blocks = [];
    for (let i = 1; i <= 10; i++) {
      const id = randomUUID();
      blockIds.push(id);
      const num = String(i).padStart(3, '0');
      blocks.push({
        id,
        code: `C2REC-${num}`,
        communeId,
        label: `Manzana ${num}`,
        neighborhood: 'Barrio ejemplo',
        polygon: null,
        centroidLat: null,
        centroidLng: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('blocks', blocks);

    const assignments = blockIds.slice(0, 5).map((blockId) => ({
      id: randomUUID(),
      userId: recorredorId,
      blockId,
      assignedBy: coordinadorId,
      startDate: '2025-01-01',
      endDate: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));
    await queryInterface.bulkInsert('block_assignments', assignments);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('block_assignments', null, {});
    await queryInterface.bulkDelete('blocks', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('communes', null, {});
  },
};
