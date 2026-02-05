import { z } from 'zod'

export const budgetCategorySchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  name: z.string().min(1).max(200),
  plannedAmount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetCategory = z.infer<typeof budgetCategorySchema>

export const createCategorySchema = budgetCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateCategory = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial().omit({ budgetId: true })

export type UpdateCategory = z.infer<typeof updateCategorySchema>

export const DEFAULT_CATEGORIES = [
  'Venue',
  'Catering',
  'Speakers',
  'Marketing',
  'Equipment',
  'Staff',
  'Other'
] as const

export type DefaultCategoryName = (typeof DEFAULT_CATEGORIES)[number]
