const { z } = require('zod');

const createBlockSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  communeId: z.string().uuid('Comuna inválida'),
  label: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  polygon: z.any().optional().nullable(),
  centroidLat: z.number().optional().nullable(),
  centroidLng: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateBlockSchema = createBlockSchema.partial();

module.exports = { createBlockSchema, updateBlockSchema };
