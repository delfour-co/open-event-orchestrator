import { z } from 'zod'

export const packageCurrencySchema = z.enum(['EUR', 'USD', 'GBP'])

export type PackageCurrency = z.infer<typeof packageCurrencySchema>

export const benefitSchema = z.object({
  name: z.string().min(1).max(200),
  included: z.boolean()
})

export type Benefit = z.infer<typeof benefitSchema>

export const sponsorPackageSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(100),
  tier: z.number().int().min(1),
  price: z.number().min(0),
  currency: packageCurrencySchema,
  maxSponsors: z.number().int().min(0).optional(),
  benefits: z.array(benefitSchema).default([]),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SponsorPackage = z.infer<typeof sponsorPackageSchema>

export const createPackageSchema = sponsorPackageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreatePackage = z.infer<typeof createPackageSchema>

export const updatePackageSchema = createPackageSchema.partial().omit({
  editionId: true
})

export type UpdatePackage = z.infer<typeof updatePackageSchema>

export const DEFAULT_BENEFITS = [
  'Logo on website',
  'Logo on printed materials',
  'Social media mention',
  'Booth at venue',
  'Speaking slot',
  'Attendee list access',
  'VIP dinner invitation',
  'Free tickets'
] as const

export const DEFAULT_PACKAGE_TIERS = [
  { name: 'Platinum', tier: 1 },
  { name: 'Gold', tier: 2 },
  { name: 'Silver', tier: 3 },
  { name: 'Bronze', tier: 4 }
] as const

export const formatPackagePrice = (price: number, currency: PackageCurrency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  return formatter.format(price)
}

export const getTierLabel = (tier: number): string => {
  const labels: Record<number, string> = {
    1: 'Tier 1 (Highest)',
    2: 'Tier 2',
    3: 'Tier 3',
    4: 'Tier 4',
    5: 'Tier 5 (Lowest)'
  }
  return labels[tier] || `Tier ${tier}`
}

export const getIncludedBenefits = (benefits: Benefit[]): Benefit[] => {
  return benefits.filter((b) => b.included)
}

export const getExcludedBenefits = (benefits: Benefit[]): Benefit[] => {
  return benefits.filter((b) => !b.included)
}

export const hasAvailableSlots = (pkg: SponsorPackage, currentCount: number): boolean => {
  if (pkg.maxSponsors === undefined || pkg.maxSponsors === null) {
    return true
  }
  return currentCount < pkg.maxSponsors
}

export const getAvailableSlots = (pkg: SponsorPackage, currentCount: number): number | null => {
  if (pkg.maxSponsors === undefined || pkg.maxSponsors === null) {
    return null
  }
  return Math.max(0, pkg.maxSponsors - currentCount)
}

export const createDefaultBenefits = (): Benefit[] => {
  return DEFAULT_BENEFITS.map((name) => ({
    name,
    included: false
  }))
}

export const sortPackagesByTier = (packages: SponsorPackage[]): SponsorPackage[] => {
  return [...packages].sort((a, b) => a.tier - b.tier)
}
