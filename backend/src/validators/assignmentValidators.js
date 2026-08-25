const { z } = require('zod');

const geoGeometrySchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.array(z.any()).min(1),
});

const cadastralFeatureSchema = z.object({
  cadastralId: z.union([z.number(), z.string()]),
  code: z.string().min(1, 'Código de manzana requerido'),
  label: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  communeId: z.string().uuid('Comuna inválida'),
  geometry: geoGeometrySchema,
});

const createAssignmentSchema = z
  .object({
    userId: z.string().uuid('Usuario inválido'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    blockId: z.string().uuid('Manzana inválida').optional(),
    cadastral: cadastralFeatureSchema.optional(),
  })
  .refine((data) => data.blockId || data.cadastral, {
    message: 'Debés indicar blockId o datos catastrales de la manzana',
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
