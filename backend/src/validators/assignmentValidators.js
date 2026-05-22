const { z } = require('zod');

const createAssignmentSchema = z.object({
  userId: z.string().uuid('Usuario inválido'),
  blockId: z.string().uuid('Manzana inválida'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

const updateAssignmentSchema = z.object({
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

module.exports = { createAssignmentSchema, updateAssignmentSchema };
