const { z } = require('zod');

const createCommuneSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Código requerido'),
  description: z.string().optional().nullable(),
});

const updateCommuneSchema = createCommuneSchema.partial();

module.exports = { createCommuneSchema, updateCommuneSchema };
