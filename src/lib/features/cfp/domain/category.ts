import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  order: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Category = z.infer<typeof categorySchema>

export const createCategorySchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateCategory = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()

export type UpdateCategory = z.infer<typeof updateCategorySchema>
