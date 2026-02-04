import { z } from 'zod'

export const trackSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#6b7280'),
  description: z.string().max(500).optional(),
  order: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Track = z.infer<typeof trackSchema>

export const createTrackSchema = trackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTrack = z.infer<typeof createTrackSchema>

export const updateTrackSchema = createTrackSchema.partial().extend({
  id: z.string()
})

export type UpdateTrack = z.infer<typeof updateTrackSchema>

// Domain functions
export function validateTrack(data: unknown): Track {
  return trackSchema.parse(data)
}

export function createTrack(data: unknown): CreateTrack {
  return createTrackSchema.parse(data)
}
