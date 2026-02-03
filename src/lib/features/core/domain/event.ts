import { z } from 'zod'

export const eventSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Event = z.infer<typeof eventSchema>

export type CreateEventInput = {
  organizationId: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'organizationId'>>
