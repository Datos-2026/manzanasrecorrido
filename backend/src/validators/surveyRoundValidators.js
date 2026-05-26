const { z } = require('zod');

const startSurveyRoundSchema = z.object({
  blockId: z.string().uuid('Manzana inválida'),
  weekNumber: z.number().int().min(1).max(5),
  notes: z.string().optional().nullable(),
});

const closeSurveyRoundSchema = z.object({
  notes: z.string().optional().nullable(),
});

module.exports = { startSurveyRoundSchema, closeSurveyRoundSchema };
