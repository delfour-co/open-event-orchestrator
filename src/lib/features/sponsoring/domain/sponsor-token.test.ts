import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type SponsorToken,
  TOKEN_EXPIRY_DAYS,
  TOKEN_LENGTH,
  buildPortalUrl,
  createSponsorTokenSchema,
  getDaysUntilExpiry,
  getTokenExpiryDate,
  isTokenExpired,
  isTokenExpiringSoon,
  isTokenValid,
  sponsorTokenSchema
} from './sponsor-token'

describe('SponsorToken Domain', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validToken: SponsorToken = {
    id: 'token123',
    editionSponsorId: 'es123',
    token: 'a'.repeat(64),
    expiresAt: new Date('2024-09-15T12:00:00Z'),
    lastUsedAt: new Date('2024-06-14T12:00:00Z'),
    createdAt: new Date('2024-06-01T12:00:00Z')
  }

  describe('sponsorTokenSchema', () => {
    it('should validate a complete token', () => {
      const result = sponsorTokenSchema.safeParse(validToken)
      expect(result.success).toBe(true)
    })

    it('should validate token without expiresAt (never expires)', () => {
      const token = { ...validToken, expiresAt: undefined }
      const result = sponsorTokenSchema.safeParse(token)
      expect(result.success).toBe(true)
    })

    it('should validate token without lastUsedAt', () => {
      const token = { ...validToken, lastUsedAt: undefined }
      const result = sponsorTokenSchema.safeParse(token)
      expect(result.success).toBe(true)
    })

    it('should reject empty token string', () => {
      const invalid = { ...validToken, token: '' }
      const result = sponsorTokenSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createSponsorTokenSchema', () => {
    it('should omit id, createdAt, lastUsedAt', () => {
      const createData = {
        editionSponsorId: 'es123',
        token: 'abc123'
      }
      const result = createSponsorTokenSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('TOKEN_LENGTH', () => {
    it('should be 32', () => {
      expect(TOKEN_LENGTH).toBe(32)
    })
  })

  describe('TOKEN_EXPIRY_DAYS', () => {
    it('should be 90', () => {
      expect(TOKEN_EXPIRY_DAYS).toBe(90)
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for token with future expiry', () => {
      expect(isTokenExpired(validToken)).toBe(false)
    })

    it('should return true for token with past expiry', () => {
      const expired = { ...validToken, expiresAt: new Date('2024-01-01T12:00:00Z') }
      expect(isTokenExpired(expired)).toBe(true)
    })

    it('should return false for token without expiry', () => {
      const noExpiry = { ...validToken, expiresAt: undefined }
      expect(isTokenExpired(noExpiry)).toBe(false)
    })
  })

  describe('isTokenValid', () => {
    it('should return true for non-expired token', () => {
      expect(isTokenValid(validToken)).toBe(true)
    })

    it('should return false for expired token', () => {
      const expired = { ...validToken, expiresAt: new Date('2024-01-01T12:00:00Z') }
      expect(isTokenValid(expired)).toBe(false)
    })

    it('should return true for token without expiry', () => {
      const noExpiry = { ...validToken, expiresAt: undefined }
      expect(isTokenValid(noExpiry)).toBe(true)
    })
  })

  describe('getTokenExpiryDate', () => {
    it('should return date TOKEN_EXPIRY_DAYS in future by default', () => {
      const expiry = getTokenExpiryDate()
      const expected = new Date(now)
      expected.setDate(expected.getDate() + TOKEN_EXPIRY_DAYS)
      expect(expiry.getTime()).toBe(expected.getTime())
    })

    it('should return date with custom days', () => {
      const expiry = getTokenExpiryDate(30)
      const expected = new Date(now)
      expected.setDate(expected.getDate() + 30)
      expect(expiry.getTime()).toBe(expected.getTime())
    })
  })

  describe('buildPortalUrl', () => {
    it('should build correct portal URL', () => {
      const url = buildPortalUrl('https://example.com', 'conf-2024', 'abc123')
      expect(url).toBe('https://example.com/sponsor/conf-2024/portal?token=abc123')
    })

    it('should handle trailing slash in baseUrl', () => {
      const url = buildPortalUrl('https://example.com/', 'conf-2024', 'abc123')
      expect(url).toBe('https://example.com//sponsor/conf-2024/portal?token=abc123')
    })
  })

  describe('getDaysUntilExpiry', () => {
    it('should return correct days until expiry', () => {
      const days = getDaysUntilExpiry(validToken)
      expect(days).toBe(92) // 92 days from June 15 to Sept 15
    })

    it('should return null for token without expiry', () => {
      const noExpiry = { ...validToken, expiresAt: undefined }
      expect(getDaysUntilExpiry(noExpiry)).toBe(null)
    })

    it('should return negative for expired token', () => {
      const expired = { ...validToken, expiresAt: new Date('2024-06-10T12:00:00Z') }
      const days = getDaysUntilExpiry(expired)
      expect(days).toBeLessThan(0)
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('should return true when expiring within threshold', () => {
      const expiringSoon = { ...validToken, expiresAt: new Date('2024-06-20T12:00:00Z') }
      expect(isTokenExpiringSoon(expiringSoon, 7)).toBe(true)
    })

    it('should return false when not expiring soon', () => {
      expect(isTokenExpiringSoon(validToken, 7)).toBe(false)
    })

    it('should return false for already expired token', () => {
      const expired = { ...validToken, expiresAt: new Date('2024-06-10T12:00:00Z') }
      expect(isTokenExpiringSoon(expired, 7)).toBe(false)
    })

    it('should return false for token without expiry', () => {
      const noExpiry = { ...validToken, expiresAt: undefined }
      expect(isTokenExpiringSoon(noExpiry)).toBe(false)
    })

    it('should use default threshold of 7 days', () => {
      const expiringSoon = { ...validToken, expiresAt: new Date('2024-06-20T12:00:00Z') }
      expect(isTokenExpiringSoon(expiringSoon)).toBe(true)
    })
  })
})
