import { describe, expect, it } from 'vitest'
import { eventSchema } from './event'

describe('Event', () => {
  describe('eventSchema', () => {
    it('should validate a valid event', () => {
      const validEvent = {
        id: 'abc123',
        organizationId: 'org123',
        name: 'DevFest',
        slug: 'devfest',
        description: 'Annual developer festival',
        logo: 'https://example.com/logo.png',
        website: 'https://devfest.example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })

    it('should validate event without optional fields', () => {
      const minimalEvent = {
        id: 'abc123',
        organizationId: 'org123',
        name: 'DevFest',
        slug: 'devfest',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(minimalEvent)
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidEvent = {
        id: 'abc123',
        organizationId: 'org123',
        name: 'D',
        slug: 'devfest',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should reject invalid slug format', () => {
      const invalidEvent = {
        id: 'abc123',
        organizationId: 'org123',
        name: 'DevFest',
        slug: 'Dev Fest', // Invalid: contains space and uppercase
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should reject missing organizationId', () => {
      const invalidEvent = {
        id: 'abc123',
        name: 'DevFest',
        slug: 'devfest',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should reject description longer than 2000 characters', () => {
      const invalidEvent = {
        id: 'abc123',
        organizationId: 'org123',
        name: 'DevFest',
        slug: 'devfest',
        description: 'a'.repeat(2001),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = eventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })
  })
})
