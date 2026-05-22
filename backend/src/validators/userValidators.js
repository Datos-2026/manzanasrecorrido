const { z } = require('zod');

const createUserSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'coordinador', 'recorredor']).default('recorredor'),
  communeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

module.exports = { createUserSchema, updateUserSchema };
