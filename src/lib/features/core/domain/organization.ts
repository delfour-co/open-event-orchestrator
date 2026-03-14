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
  vatRate: z.number().min(0).max(100).optional(),
  legalName: z.string().optional(),
  siret: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  legalForm: z.string().optional(),
  rcsNumber: z.string().optional(),
  shareCapital: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  youtube: z.string().url().optional(),
  timezone: z.string().optional(),
  defaultLocale: z.string().optional(),
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
  vatRate?: number
  legalName?: string
  siret?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  legalForm?: string
  rcsNumber?: string
  shareCapital?: string
  primaryColor?: string
  secondaryColor?: string
  twitter?: string
  linkedin?: string
  github?: string
  youtube?: string
  timezone?: string
  defaultLocale?: string
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>
