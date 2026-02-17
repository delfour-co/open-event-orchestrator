import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type SetupToken,
  calculateTokenExpiration,
  generateOrganizationSlug,
  generateSetupToken,
  initialSetupSchema,
  isTokenExpired,
  isTokenValid,
  setupTokenSchema
} from './setup-token'

describe('Setup Token Domain', () => {
  describe('setupTokenSchema', () => {
    it('should accept valid setup token', () => {
      const token = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = setupTokenSchema.safeParse(token)
      expect(result.success).toBe(true)
    })

    it('should accept token with usedAt date', () => {
      const token = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date(),
        used: true,
        usedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = setupTokenSchema.safeParse(token)
      expect(result.success).toBe(true)
    })

    it('should reject token shorter than 32 characters', () => {
      const token = {
        id: 'abc123',
        token: 'a'.repeat(31),
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = setupTokenSchema.safeParse(token)
      expect(result.success).toBe(false)
    })

    it('should reject token longer than 64 characters', () => {
      const token = {
        id: 'abc123',
        token: 'a'.repeat(65),
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = setupTokenSchema.safeParse(token)
      expect(result.success).toBe(false)
    })
  })

  describe('initialSetupSchema', () => {
    it('should accept valid initial setup data', () => {
      const result = initialSetupSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        organizationName: 'My Organization'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = initialSetupSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        passwordConfirm: 'password123',
        organizationName: 'My Organization'
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = initialSetupSchema.safeParse({
        email: 'admin@example.com',
        password: '1234567',
        passwordConfirm: '1234567',
        organizationName: 'My Organization'
      })
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const result = initialSetupSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
        passwordConfirm: 'different123',
        organizationName: 'My Organization'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('passwordConfirm')
      }
    })

    it('should reject short organization name', () => {
      const result = initialSetupSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        organizationName: 'A'
      })
      expect(result.success).toBe(false)
    })

    it('should reject organization name longer than 100 characters', () => {
      const result = initialSetupSchema.safeParse({
        email: 'admin@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        organizationName: 'A'.repeat(101)
      })
      expect(result.success).toBe(false)
    })
  })

  describe('generateSetupToken', () => {
    it('should generate token with correct length', () => {
      const token = generateSetupToken()
      expect(token.length).toBe(48)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSetupToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should only contain alphanumeric characters', () => {
      const token = generateSetupToken()
      expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true)
    })
  })

  describe('calculateTokenExpiration', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return date 24 hours in the future', () => {
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)

      const expiration = calculateTokenExpiration()
      const expected = new Date('2024-01-16T10:00:00Z')

      expect(expiration.getTime()).toBe(expected.getTime())
    })
  })

  describe('isTokenExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return false for future date', () => {
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)

      const futureDate = new Date('2024-01-16T10:00:00Z')
      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true for past date', () => {
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)

      const pastDate = new Date('2024-01-14T10:00:00Z')
      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('should return false for exact current date (boundary case)', () => {
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)

      // When dates are exactly equal, the token is not yet expired
      expect(isTokenExpired(now)).toBe(false)
    })
  })

  describe('isTokenValid', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for unused and non-expired token', () => {
      const token: SetupToken = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date('2024-01-16T10:00:00Z'),
        used: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(isTokenValid(token)).toBe(true)
    })

    it('should return false for used token', () => {
      const token: SetupToken = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date('2024-01-16T10:00:00Z'),
        used: true,
        usedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(isTokenValid(token)).toBe(false)
    })

    it('should return false for expired token', () => {
      const token: SetupToken = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date('2024-01-14T10:00:00Z'),
        used: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(isTokenValid(token)).toBe(false)
    })

    it('should return false for used and expired token', () => {
      const token: SetupToken = {
        id: 'abc123',
        token: 'a'.repeat(48),
        expiresAt: new Date('2024-01-14T10:00:00Z'),
        used: true,
        usedAt: new Date('2024-01-13T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(isTokenValid(token)).toBe(false)
    })
  })

  describe('generateOrganizationSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateOrganizationSlug('My Organization')).toBe('my-organization')
    })

    it('should replace spaces with hyphens', () => {
      expect(generateOrganizationSlug('hello world')).toBe('hello-world')
    })

    it('should remove accents', () => {
      expect(generateOrganizationSlug('Cafe Economie')).toBe('cafe-economie')
      expect(generateOrganizationSlug('evenement')).toBe('evenement')
    })

    it('should remove special characters', () => {
      expect(generateOrganizationSlug('Hello! World?')).toBe('hello-world')
      expect(generateOrganizationSlug('Test@#$%^&*')).toBe('test')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(generateOrganizationSlug('-hello-')).toBe('hello')
      expect(generateOrganizationSlug('---test---')).toBe('test')
    })

    it('should collapse multiple hyphens', () => {
      expect(generateOrganizationSlug('hello   world')).toBe('hello-world')
      expect(generateOrganizationSlug('a--b--c')).toBe('a-b-c')
    })

    it('should truncate to 50 characters', () => {
      const longName = 'a'.repeat(60)
      const slug = generateOrganizationSlug(longName)
      expect(slug.length).toBeLessThanOrEqual(50)
    })

    it('should handle empty string', () => {
      expect(generateOrganizationSlug('')).toBe('')
    })

    it('should handle numbers', () => {
      expect(generateOrganizationSlug('Event 2024')).toBe('event-2024')
    })
  })
})
