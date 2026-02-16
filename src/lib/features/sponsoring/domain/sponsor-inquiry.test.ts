import { describe, expect, it } from 'vitest'
import {
  type SponsorInquiry,
  createSponsorInquirySchema,
  getStatusBadgeVariant,
  getStatusColor,
  getStatusLabel,
  isActiveInquiry,
  isPendingInquiry,
  sponsorInquirySchema,
  sponsorInquiryStatusSchema,
  updateSponsorInquirySchema
} from './sponsor-inquiry'

describe('SponsorInquiry Domain', () => {
  const validInquiry: SponsorInquiry = {
    id: 'inquiry123',
    editionId: 'edition123',
    companyName: 'Acme Corporation',
    contactName: 'John Doe',
    contactEmail: 'john@acme.com',
    contactPhone: '+1234567890',
    message: 'We are interested in sponsoring your event.',
    interestedPackageId: 'pkg123',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('sponsorInquiryStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(sponsorInquiryStatusSchema.safeParse('pending').success).toBe(true)
      expect(sponsorInquiryStatusSchema.safeParse('contacted').success).toBe(true)
      expect(sponsorInquiryStatusSchema.safeParse('converted').success).toBe(true)
      expect(sponsorInquiryStatusSchema.safeParse('rejected').success).toBe(true)
    })

    it('should reject invalid status', () => {
      expect(sponsorInquiryStatusSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('sponsorInquirySchema', () => {
    it('should validate a complete inquiry', () => {
      const result = sponsorInquirySchema.safeParse(validInquiry)
      expect(result.success).toBe(true)
    })

    it('should validate an inquiry with minimal fields', () => {
      const minimal = {
        id: 'inquiry123',
        editionId: 'edition123',
        companyName: 'Acme',
        contactName: 'John',
        contactEmail: 'john@acme.com',
        message: 'Interested',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorInquirySchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject inquiry without companyName', () => {
      const invalid = { ...validInquiry, companyName: '' }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject inquiry with companyName too long', () => {
      const invalid = { ...validInquiry, companyName: 'a'.repeat(201) }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject inquiry without contactName', () => {
      const invalid = { ...validInquiry, contactName: '' }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
      const invalid = { ...validInquiry, contactEmail: 'invalid-email' }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject inquiry without message', () => {
      const invalid = { ...validInquiry, message: '' }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject message too long', () => {
      const invalid = { ...validInquiry, message: 'a'.repeat(5001) }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject phone too long', () => {
      const invalid = { ...validInquiry, contactPhone: 'a'.repeat(51) }
      const result = sponsorInquirySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createSponsorInquirySchema', () => {
    it('should omit id, status, createdAt, updatedAt', () => {
      const createData = {
        editionId: 'edition123',
        companyName: 'New Company',
        contactName: 'Jane Doe',
        contactEmail: 'jane@company.com',
        message: 'We want to sponsor'
      }
      const result = createSponsorInquirySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should require editionId', () => {
      const createData = {
        companyName: 'New Company',
        contactName: 'Jane Doe',
        contactEmail: 'jane@company.com',
        message: 'We want to sponsor'
      }
      const result = createSponsorInquirySchema.safeParse(createData)
      expect(result.success).toBe(false)
    })

    it('should allow optional interestedPackageId', () => {
      const createData = {
        editionId: 'edition123',
        companyName: 'New Company',
        contactName: 'Jane Doe',
        contactEmail: 'jane@company.com',
        message: 'We want to sponsor',
        interestedPackageId: 'pkg123'
      }
      const result = createSponsorInquirySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSponsorInquirySchema', () => {
    it('should allow status update', () => {
      const updateData = { status: 'contacted' }
      const result = updateSponsorInquirySchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateSponsorInquirySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const updateData = { status: 'invalid' }
      const result = updateSponsorInquirySchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })
  })

  describe('getStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getStatusLabel('pending')).toBe('Pending')
      expect(getStatusLabel('contacted')).toBe('Contacted')
      expect(getStatusLabel('converted')).toBe('Converted')
      expect(getStatusLabel('rejected')).toBe('Rejected')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors', () => {
      expect(getStatusColor('pending')).toBe('yellow')
      expect(getStatusColor('contacted')).toBe('blue')
      expect(getStatusColor('converted')).toBe('green')
      expect(getStatusColor('rejected')).toBe('red')
    })
  })

  describe('getStatusBadgeVariant', () => {
    it('should return correct badge variants', () => {
      expect(getStatusBadgeVariant('pending')).toBe('outline')
      expect(getStatusBadgeVariant('contacted')).toBe('secondary')
      expect(getStatusBadgeVariant('converted')).toBe('default')
      expect(getStatusBadgeVariant('rejected')).toBe('destructive')
    })
  })

  describe('isPendingInquiry', () => {
    it('should return true for pending inquiry', () => {
      expect(isPendingInquiry(validInquiry)).toBe(true)
    })

    it('should return false for non-pending inquiry', () => {
      const contacted = { ...validInquiry, status: 'contacted' as const }
      expect(isPendingInquiry(contacted)).toBe(false)
    })
  })

  describe('isActiveInquiry', () => {
    it('should return true for pending inquiry', () => {
      expect(isActiveInquiry(validInquiry)).toBe(true)
    })

    it('should return true for contacted inquiry', () => {
      const contacted = { ...validInquiry, status: 'contacted' as const }
      expect(isActiveInquiry(contacted)).toBe(true)
    })

    it('should return false for converted inquiry', () => {
      const converted = { ...validInquiry, status: 'converted' as const }
      expect(isActiveInquiry(converted)).toBe(false)
    })

    it('should return false for rejected inquiry', () => {
      const rejected = { ...validInquiry, status: 'rejected' as const }
      expect(isActiveInquiry(rejected)).toBe(false)
    })
  })
})
