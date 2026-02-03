import { describe, expect, it } from 'vitest'
import { editionSchema, validateEditionDates } from './edition'

describe('Edition', () => {
  describe('editionSchema', () => {
    it('should validate a valid edition', () => {
      const validEdition = {
        id: 'abc123',
        eventId: 'event123',
        name: 'DevFest 2024',
        slug: 'devfest-2024',
        year: 2024,
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-16'),
        venue: 'Convention Center',
        city: 'Paris',
        country: 'France',
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = editionSchema.safeParse(validEdition)
      expect(result.success).toBe(true)
    })

    it('should reject invalid slug format', () => {
      const invalidEdition = {
        id: 'abc123',
        eventId: 'event123',
        name: 'DevFest 2024',
        slug: 'DevFest 2024', // Invalid: contains spaces and uppercase
        year: 2024,
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-16'),
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = editionSchema.safeParse(invalidEdition)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidEdition = {
        id: 'abc123',
        eventId: 'event123',
        name: 'DevFest 2024',
        slug: 'devfest-2024',
        year: 2024,
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-16'),
        status: 'invalid_status',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = editionSchema.safeParse(invalidEdition)
      expect(result.success).toBe(false)
    })

    it('should reject year outside valid range', () => {
      const invalidEdition = {
        id: 'abc123',
        eventId: 'event123',
        name: 'DevFest',
        slug: 'devfest',
        year: 1999, // Invalid: before 2000
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-16'),
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = editionSchema.safeParse(invalidEdition)
      expect(result.success).toBe(false)
    })
  })

  describe('validateEditionDates', () => {
    it('should return true when start date is before end date', () => {
      const startDate = new Date('2024-10-15')
      const endDate = new Date('2024-10-16')

      expect(validateEditionDates(startDate, endDate)).toBe(true)
    })

    it('should return false when start date is after end date', () => {
      const startDate = new Date('2024-10-16')
      const endDate = new Date('2024-10-15')

      expect(validateEditionDates(startDate, endDate)).toBe(false)
    })

    it('should return false when start date equals end date', () => {
      const date = new Date('2024-10-15')

      expect(validateEditionDates(date, date)).toBe(false)
    })
  })
})
