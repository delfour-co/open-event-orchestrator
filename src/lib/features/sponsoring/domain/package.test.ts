import { describe, expect, it } from 'vitest'
import {
  type Benefit,
  DEFAULT_BENEFITS,
  type SponsorPackage,
  benefitSchema,
  createDefaultBenefits,
  createPackageSchema,
  formatPackagePrice,
  getAvailableSlots,
  getExcludedBenefits,
  getIncludedBenefits,
  getTierLabel,
  hasAvailableSlots,
  packageCurrencySchema,
  sortPackagesByTier,
  sponsorPackageSchema,
  updatePackageSchema
} from './package'

describe('Package Domain', () => {
  const validPackage: SponsorPackage = {
    id: 'pkg123',
    editionId: 'ed123',
    name: 'Gold',
    tier: 2,
    price: 5000,
    currency: 'EUR',
    maxSponsors: 5,
    benefits: [
      { name: 'Logo on website', included: true },
      { name: 'Speaking slot', included: false }
    ],
    description: 'Premium sponsorship package',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('packageCurrencySchema', () => {
    it('should accept EUR', () => {
      expect(packageCurrencySchema.safeParse('EUR').success).toBe(true)
    })

    it('should accept USD', () => {
      expect(packageCurrencySchema.safeParse('USD').success).toBe(true)
    })

    it('should accept GBP', () => {
      expect(packageCurrencySchema.safeParse('GBP').success).toBe(true)
    })

    it('should reject invalid currency', () => {
      expect(packageCurrencySchema.safeParse('JPY').success).toBe(false)
    })
  })

  describe('benefitSchema', () => {
    it('should validate a valid benefit', () => {
      const benefit: Benefit = { name: 'Logo on website', included: true }
      const result = benefitSchema.safeParse(benefit)
      expect(result.success).toBe(true)
    })

    it('should reject empty benefit name', () => {
      const benefit = { name: '', included: true }
      const result = benefitSchema.safeParse(benefit)
      expect(result.success).toBe(false)
    })

    it('should reject benefit name too long', () => {
      const benefit = { name: 'a'.repeat(201), included: true }
      const result = benefitSchema.safeParse(benefit)
      expect(result.success).toBe(false)
    })
  })

  describe('sponsorPackageSchema', () => {
    it('should validate a complete package', () => {
      const result = sponsorPackageSchema.safeParse(validPackage)
      expect(result.success).toBe(true)
    })

    it('should validate a package with minimal fields', () => {
      const minimal = {
        id: 'pkg123',
        editionId: 'ed123',
        name: 'Bronze',
        tier: 4,
        price: 1000,
        currency: 'EUR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorPackageSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject tier less than 1', () => {
      const invalid = { ...validPackage, tier: 0 }
      const result = sponsorPackageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject negative price', () => {
      const invalid = { ...validPackage, price: -100 }
      const result = sponsorPackageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject name too long', () => {
      const invalid = { ...validPackage, name: 'a'.repeat(101) }
      const result = sponsorPackageSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should accept price of 0 (free tier)', () => {
      const free = { ...validPackage, price: 0 }
      const result = sponsorPackageSchema.safeParse(free)
      expect(result.success).toBe(true)
    })

    it('should default isActive to true', () => {
      const pkg = {
        id: 'pkg123',
        editionId: 'ed123',
        name: 'Test',
        tier: 1,
        price: 1000,
        currency: 'EUR',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorPackageSchema.safeParse(pkg)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true)
      }
    })
  })

  describe('createPackageSchema', () => {
    it('should omit id, createdAt, updatedAt', () => {
      const createData = {
        editionId: 'ed123',
        name: 'New Package',
        tier: 1,
        price: 10000,
        currency: 'USD'
      }
      const result = createPackageSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updatePackageSchema', () => {
    it('should allow partial updates', () => {
      const updateData = {
        name: 'Updated Name',
        price: 6000
      }
      const result = updatePackageSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should not allow editionId update', () => {
      const updateData = {
        editionId: 'new-ed',
        name: 'Updated'
      }
      const result = updatePackageSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('editionId')
      }
    })
  })

  describe('DEFAULT_BENEFITS', () => {
    it('should contain expected benefits', () => {
      expect(DEFAULT_BENEFITS).toContain('Logo on website')
      expect(DEFAULT_BENEFITS).toContain('Booth at venue')
      expect(DEFAULT_BENEFITS).toContain('Speaking slot')
    })

    it('should have at least 5 default benefits', () => {
      expect(DEFAULT_BENEFITS.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('formatPackagePrice', () => {
    it('should format EUR correctly', () => {
      const result = formatPackagePrice(5000, 'EUR')
      expect(result).toContain('5,000')
    })

    it('should format USD correctly', () => {
      const result = formatPackagePrice(5000, 'USD')
      expect(result).toContain('5,000')
    })

    it('should format 0 correctly', () => {
      const result = formatPackagePrice(0, 'EUR')
      expect(result).toContain('0')
    })
  })

  describe('getTierLabel', () => {
    it('should return label for tier 1', () => {
      expect(getTierLabel(1)).toBe('Tier 1 (Highest)')
    })

    it('should return label for tier 5', () => {
      expect(getTierLabel(5)).toBe('Tier 5 (Lowest)')
    })

    it('should return generic label for unknown tier', () => {
      expect(getTierLabel(10)).toBe('Tier 10')
    })
  })

  describe('getIncludedBenefits', () => {
    it('should return only included benefits', () => {
      const benefits: Benefit[] = [
        { name: 'A', included: true },
        { name: 'B', included: false },
        { name: 'C', included: true }
      ]
      const result = getIncludedBenefits(benefits)
      expect(result).toHaveLength(2)
      expect(result.map((b) => b.name)).toEqual(['A', 'C'])
    })

    it('should return empty array when no benefits included', () => {
      const benefits: Benefit[] = [
        { name: 'A', included: false },
        { name: 'B', included: false }
      ]
      expect(getIncludedBenefits(benefits)).toHaveLength(0)
    })
  })

  describe('getExcludedBenefits', () => {
    it('should return only excluded benefits', () => {
      const benefits: Benefit[] = [
        { name: 'A', included: true },
        { name: 'B', included: false },
        { name: 'C', included: true }
      ]
      const result = getExcludedBenefits(benefits)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('B')
    })
  })

  describe('hasAvailableSlots', () => {
    it('should return true when no maxSponsors limit', () => {
      const pkg = { ...validPackage, maxSponsors: undefined }
      expect(hasAvailableSlots(pkg, 100)).toBe(true)
    })

    it('should return true when under limit', () => {
      expect(hasAvailableSlots(validPackage, 3)).toBe(true)
    })

    it('should return false when at limit', () => {
      expect(hasAvailableSlots(validPackage, 5)).toBe(false)
    })

    it('should return false when over limit', () => {
      expect(hasAvailableSlots(validPackage, 10)).toBe(false)
    })
  })

  describe('getAvailableSlots', () => {
    it('should return null when no maxSponsors limit', () => {
      const pkg = { ...validPackage, maxSponsors: undefined }
      expect(getAvailableSlots(pkg, 10)).toBe(null)
    })

    it('should return remaining slots', () => {
      expect(getAvailableSlots(validPackage, 3)).toBe(2)
    })

    it('should return 0 when at limit', () => {
      expect(getAvailableSlots(validPackage, 5)).toBe(0)
    })

    it('should return 0 when over limit', () => {
      expect(getAvailableSlots(validPackage, 10)).toBe(0)
    })
  })

  describe('createDefaultBenefits', () => {
    it('should create benefits from DEFAULT_BENEFITS', () => {
      const benefits = createDefaultBenefits()
      expect(benefits.length).toBe(DEFAULT_BENEFITS.length)
    })

    it('should set all benefits as not included', () => {
      const benefits = createDefaultBenefits()
      expect(benefits.every((b) => b.included === false)).toBe(true)
    })
  })

  describe('sortPackagesByTier', () => {
    it('should sort packages by tier ascending', () => {
      const packages: SponsorPackage[] = [
        { ...validPackage, id: '1', tier: 3 },
        { ...validPackage, id: '2', tier: 1 },
        { ...validPackage, id: '3', tier: 2 }
      ]
      const sorted = sortPackagesByTier(packages)
      expect(sorted.map((p) => p.tier)).toEqual([1, 2, 3])
    })

    it('should not modify original array', () => {
      const packages: SponsorPackage[] = [
        { ...validPackage, id: '1', tier: 3 },
        { ...validPackage, id: '2', tier: 1 }
      ]
      sortPackagesByTier(packages)
      expect(packages[0].tier).toBe(3)
    })
  })
})
