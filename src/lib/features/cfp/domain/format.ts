import { z } from 'zod'

export const formatSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(5).max(480),
  order: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Format = z.infer<typeof formatSchema>

export const createFormatSchema = formatSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateFormat = z.infer<typeof createFormatSchema>

export const updateFormatSchema = createFormatSchema.partial()

export type UpdateFormat = z.infer<typeof updateFormatSchema>
