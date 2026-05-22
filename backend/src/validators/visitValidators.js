const { z } = require('zod');

const hygieneObservationSchema = z.object({
  trashProperlyDisposed: z.boolean().optional().nullable(),
  trashOutOfSchedule: z.boolean().optional().nullable(),
  bulkyWaste: z.boolean().optional().nullable(),
  rubble: z.boolean().optional().nullable(),
  overflowingContainers: z.boolean().optional().nullable(),
  criticalPoint: z.boolean().optional().nullable(),
  criticalPointDescription: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const createVisitSchema = z.object({
  blockId: z.string().uuid('Manzana inválida'),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  status: z.enum(['realizado', 'no_realizado', 'parcial']),
  couldVisit: z.boolean().optional(),
  reasonNotVisited: z.string().optional().nullable(),
  generalNotes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  street: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  doorbell: z.string().optional().nullable(),
  surveyData: z.any().optional().nullable(),
  weekNumber: z.number().int().min(1).max(5).optional().nullable(),
  hygieneObservation: hygieneObservationSchema.optional(),
});

const updateVisitSchema = createVisitSchema.partial().omit({ blockId: true });

module.exports = { createVisitSchema, updateVisitSchema, hygieneObservationSchema };
