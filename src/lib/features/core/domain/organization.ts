import { z } from 'zod'

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Organization = z.infer<typeof organizationSchema>

export type CreateOrganizationInput = {
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>
