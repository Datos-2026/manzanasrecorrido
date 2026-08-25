'use strict';

const { randomUUID } = require('crypto');
const { QueryTypes } = require('sequelize');

const CABA_COMMUNES = [
  { code: 'C1', name: 'Comuna 1', description: 'Retiro, San Nicolás, Puerto Madero, San Telmo, Montserrat, Constitución' },
  { code: 'C2', name: 'Comuna 2', description: 'Recoleta' },
  { code: 'C3', name: 'Comuna 3', description: 'Balvanera, San Cristóbal' },
  { code: 'C4', name: 'Comuna 4', description: 'La Boca, Barracas, Parque Patricios, Nueva Pompeya' },
  { code: 'C5', name: 'Comuna 5', description: 'Almagro, Boedo' },
  { code: 'C6', name: 'Comuna 6', description: 'Caballito' },
  { code: 'C7', name: 'Comuna 7', description: 'Flores, Parque Chacabuco' },
  { code: 'C8', name: 'Comuna 8', description: 'Villa Soldati, Villa Riachuelo, Villa Lugano' },
  { code: 'C9', name: 'Comuna 9', description: 'Liniers, Mataderos, Parque Avellaneda' },
  { code: 'C10', name: 'Comuna 10', description: 'Villa Real, Monte Castro, Versalles, Floresta, Vélez Sársfield, Villa Luro' },
  { code: 'C11', name: 'Comuna 11', description: 'Villa General Mitre, Villa Devoto, Villa del Parque, Villa Santa Rita' },
  { code: 'C12', name: 'Comuna 12', description: 'Coghlan, Saavedra, Villa Urquiza, Villa Pueyrredón' },
  { code: 'C13', name: 'Comuna 13', description: 'Núñez, Belgrano, Colegiales' },
  { code: 'C14', name: 'Comuna 14', description: 'Palermo' },
  { code: 'C15', name: 'Comuna 15', description: 'Chacarita, Villa Crespo, La Paternal, Villa Ortúzar, Agronomía, Parque Chas' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const existing = await queryInterface.sequelize.query(
      'SELECT code FROM communes',
      { type: QueryTypes.SELECT }
    );
    const existingCodes = new Set(existing.map((r) => r.code));

    const toInsert = CABA_COMMUNES.filter((c) => !existingCodes.has(c.code)).map((c) => ({
      id: randomUUID(),
      name: c.name,
      code: c.code,
      description: c.description,
      createdAt: now,
      updatedAt: now,
    }));

    if (toInsert.length) {
      await queryInterface.bulkInsert('communes', toInsert);
      console.log(`Seed: ${toInsert.length} comunas CABA insertadas`);
    } else {
      console.log('Seed: las 15 comunas CABA ya existen');
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('communes', {
      code: CABA_COMMUNES.map((c) => c.code),
    });
  },
};
