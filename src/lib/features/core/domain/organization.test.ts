import { describe, expect, it } from 'vitest'
import { organizationSchema } from './organization'

describe('Organization', () => {
  describe('organizationSchema', () => {
    it('should validate a valid organization', () => {
      const validOrg = {
        id: 'abc123',
        name: 'Tech Community',
        slug: 'tech-community',
        description: 'A great tech community',
        logo: 'https://example.com/logo.png',
        website: 'https://example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(validOrg)
      expect(result.success).toBe(true)
    })

    it('should validate organization without optional fields', () => {
      const minimalOrg = {
        id: 'abc123',
        name: 'Tech Community',
        slug: 'tech-community',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(minimalOrg)
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const invalidOrg = {
        id: 'abc123',
        name: 'A',
        slug: 'a-org',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(invalidOrg)
      expect(result.success).toBe(false)
    })

    it('should reject invalid slug format', () => {
      const invalidOrg = {
        id: 'abc123',
        name: 'Tech Community',
        slug: 'Tech Community', // Invalid: contains spaces and uppercase
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(invalidOrg)
      expect(result.success).toBe(false)
    })

    it('should reject invalid URL for logo', () => {
      const invalidOrg = {
        id: 'abc123',
        name: 'Tech Community',
        slug: 'tech-community',
        logo: 'not-a-url',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(invalidOrg)
      expect(result.success).toBe(false)
    })

    it('should reject invalid URL for website', () => {
      const invalidOrg = {
        id: 'abc123',
        name: 'Tech Community',
        slug: 'tech-community',
        website: 'not-a-url',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = organizationSchema.safeParse(invalidOrg)
      expect(result.success).toBe(false)
    })
  })
})
