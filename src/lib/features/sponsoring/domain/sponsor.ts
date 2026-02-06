import { z } from 'zod'

export const sponsorSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1).max(200),
  logo: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Sponsor = z.infer<typeof sponsorSchema>

export const createSponsorSchema = sponsorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSponsor = z.infer<typeof createSponsorSchema>

export const updateSponsorSchema = createSponsorSchema.partial().omit({
  organizationId: true
})

export type UpdateSponsor = z.infer<typeof updateSponsorSchema>

export const sponsorWithLogoUrlSchema = sponsorSchema.extend({
  logoUrl: z.string().url().optional()
})

export type SponsorWithLogoUrl = z.infer<typeof sponsorWithLogoUrlSchema>

export const hasContactInfo = (sponsor: Sponsor): boolean => {
  return !!(sponsor.contactName || sponsor.contactEmail || sponsor.contactPhone)
}

export const getDisplayName = (sponsor: Sponsor): string => {
  return sponsor.name
}

export const getSponsorInitials = (sponsor: Sponsor): string => {
  return sponsor.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
