import { describe, expect, it } from 'vitest'
import {
  type Sponsor,
  createSponsorSchema,
  getDisplayName,
  getSponsorInitials,
  hasContactInfo,
  sponsorSchema,
  updateSponsorSchema
} from './sponsor'

describe('Sponsor Domain', () => {
  const validSponsor: Sponsor = {
    id: 'sponsor123',
    organizationId: 'org123',
    name: 'Acme Corporation',
    logo: 'logo.png',
    website: 'https://acme.com',
    description: 'A leading tech company',
    contactName: 'John Doe',
    contactEmail: 'john@acme.com',
    contactPhone: '+1234567890',
    notes: 'Premium partner',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('sponsorSchema', () => {
    it('should validate a complete sponsor', () => {
      const result = sponsorSchema.safeParse(validSponsor)
      expect(result.success).toBe(true)
    })

    it('should validate a sponsor with minimal fields', () => {
      const minimal = {
        id: 'sponsor123',
        organizationId: 'org123',
        name: 'Acme',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject sponsor without name', () => {
      const invalid = { ...validSponsor, name: '' }
      const result = sponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject sponsor with name too long', () => {
      const invalid = { ...validSponsor, name: 'a'.repeat(201) }
      const result = sponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const invalid = { ...validSponsor, contactEmail: 'invalid-email' }
      const result = sponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid website URL', () => {
      const invalid = { ...validSponsor, website: 'not-a-url' }
      const result = sponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject description too long', () => {
      const invalid = { ...validSponsor, description: 'a'.repeat(2001) }
      const result = sponsorSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createSponsorSchema', () => {
    it('should omit id, createdAt, updatedAt', () => {
      const createData = {
        organizationId: 'org123',
        name: 'New Sponsor',
        contactEmail: 'contact@sponsor.com'
      }
      const result = createSponsorSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should require organizationId', () => {
      const createData = {
        name: 'New Sponsor'
      }
      const result = createSponsorSchema.safeParse(createData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateSponsorSchema', () => {
    it('should allow partial updates', () => {
      const updateData = {
        name: 'Updated Name'
      }
      const result = updateSponsorSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateSponsorSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should not allow organizationId update', () => {
      const updateData = {
        organizationId: 'new-org',
        name: 'Updated Name'
      }
      const result = updateSponsorSchema.safeParse(updateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('organizationId')
      }
    })
  })

  describe('hasContactInfo', () => {
    it('should return true when contactName exists', () => {
      const sponsor = { ...validSponsor, contactEmail: undefined, contactPhone: undefined }
      expect(hasContactInfo(sponsor)).toBe(true)
    })

    it('should return true when contactEmail exists', () => {
      const sponsor = { ...validSponsor, contactName: undefined, contactPhone: undefined }
      expect(hasContactInfo(sponsor)).toBe(true)
    })

    it('should return true when contactPhone exists', () => {
      const sponsor = { ...validSponsor, contactName: undefined, contactEmail: undefined }
      expect(hasContactInfo(sponsor)).toBe(true)
    })

    it('should return false when no contact info exists', () => {
      const sponsor = {
        ...validSponsor,
        contactName: undefined,
        contactEmail: undefined,
        contactPhone: undefined
      }
      expect(hasContactInfo(sponsor)).toBe(false)
    })
  })

  describe('getDisplayName', () => {
    it('should return the sponsor name', () => {
      expect(getDisplayName(validSponsor)).toBe('Acme Corporation')
    })
  })

  describe('getSponsorInitials', () => {
    it('should return initials from multi-word name', () => {
      expect(getSponsorInitials(validSponsor)).toBe('AC')
    })

    it('should return two characters from single-word name', () => {
      const sponsor = { ...validSponsor, name: 'Google' }
      expect(getSponsorInitials(sponsor)).toBe('G')
    })

    it('should return max two characters', () => {
      const sponsor = { ...validSponsor, name: 'Big Tech Corp Inc' }
      expect(getSponsorInitials(sponsor)).toBe('BT')
    })
  })
})
