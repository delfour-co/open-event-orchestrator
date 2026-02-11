import { describe, expect, it } from 'vitest'
import {
  GDPR_CONFIG,
  buildListUnsubscribeHeader,
  buildListUnsubscribePostHeader,
  calculateExpirationDate,
  generateConfirmationToken,
  generatePreferenceToken,
  isApproachingExpiration,
  isExpired,
  isTokenExpired,
  shouldSendReminder
} from './gdpr-compliance'

describe('GDPR Compliance Domain', () => {
  describe('generateConfirmationToken', () => {
    it('should generate a token of correct length', () => {
      const { token } = generateConfirmationToken()

      expect(token).toHaveLength(GDPR_CONFIG.CONFIRMATION_TOKEN_LENGTH)
    })

    it('should generate unique tokens', () => {
      const { token: token1 } = generateConfirmationToken()
      const { token: token2 } = generateConfirmationToken()

      expect(token1).not.toBe(token2)
    })

    it('should generate a valid hexadecimal token', () => {
      const { token } = generateConfirmationToken()

      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('should set expiration date in the future', () => {
      const { expiresAt } = generateConfirmationToken()

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should set expiration based on config', () => {
      const before = new Date()
      const { expiresAt } = generateConfirmationToken()
      const after = new Date()

      const expectedMinHours = GDPR_CONFIG.CONFIRMATION_TOKEN_EXPIRY_HOURS
      const minExpiry = new Date(before.getTime() + expectedMinHours * 60 * 60 * 1000)
      const maxExpiry = new Date(after.getTime() + expectedMinHours * 60 * 60 * 1000 + 1000)

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpiry.getTime())
      expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpiry.getTime())
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for future expiration date', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now

      expect(isTokenExpired(futureDate)).toBe(false)
    })

    it('should return true for past expiration date', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago

      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('should return true for current time', () => {
      const now = new Date()

      // Slight tolerance for test execution time
      expect(isTokenExpired(new Date(now.getTime() - 1))).toBe(true)
    })
  })

  describe('shouldSendReminder', () => {
    it('should return false when max reminders reached', () => {
      const result = shouldSendReminder(undefined, GDPR_CONFIG.MAX_REMINDER_COUNT)

      expect(result).toBe(false)
    })

    it('should return true when no reminder has been sent', () => {
      const result = shouldSendReminder(undefined, 0)

      expect(result).toBe(true)
    })

    it('should return false when last reminder was sent recently', () => {
      const recentDate = new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago

      expect(shouldSendReminder(recentDate, 0)).toBe(false)
    })

    it('should return true when enough time has passed since last reminder', () => {
      const oldDate = new Date(
        Date.now() - 1000 * 60 * 60 * 24 * (GDPR_CONFIG.REMINDER_INTERVAL_DAYS + 1)
      )

      expect(shouldSendReminder(oldDate, 1)).toBe(true)
    })

    it('should return false when exactly at reminder count limit', () => {
      const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)

      expect(shouldSendReminder(oldDate, GDPR_CONFIG.MAX_REMINDER_COUNT)).toBe(false)
    })
  })

  describe('calculateExpirationDate', () => {
    it('should add retention days to created date', () => {
      const createdAt = new Date('2024-01-01')
      const retentionDays = 30

      const result = calculateExpirationDate(createdAt, retentionDays)

      expect(result).toEqual(new Date('2024-01-31'))
    })

    it('should handle year boundary', () => {
      const createdAt = new Date('2024-12-15')
      const retentionDays = 30

      const result = calculateExpirationDate(createdAt, retentionDays)

      expect(result).toEqual(new Date('2025-01-14'))
    })

    it('should handle leap year', () => {
      const createdAt = new Date('2024-02-28')
      const retentionDays = 1

      const result = calculateExpirationDate(createdAt, retentionDays)

      expect(result).toEqual(new Date('2024-02-29'))
    })
  })

  describe('isApproachingExpiration', () => {
    it('should return true when within warning period', () => {
      const now = new Date()
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 25) // 25 days ago
      const retentionDays = 30
      const warningDays = 7

      expect(isApproachingExpiration(createdAt, retentionDays, warningDays)).toBe(true)
    })

    it('should return false when not within warning period', () => {
      const now = new Date()
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
      const retentionDays = 30
      const warningDays = 7

      expect(isApproachingExpiration(createdAt, retentionDays, warningDays)).toBe(false)
    })

    it('should return true when already expired', () => {
      const now = new Date()
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 35) // 35 days ago
      const retentionDays = 30
      const warningDays = 7

      expect(isApproachingExpiration(createdAt, retentionDays, warningDays)).toBe(true)
    })
  })

  describe('isExpired', () => {
    it('should return true when past expiration', () => {
      const now = new Date()
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 35) // 35 days ago
      const retentionDays = 30

      expect(isExpired(createdAt, retentionDays)).toBe(true)
    })

    it('should return false when before expiration', () => {
      const now = new Date()
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 25) // 25 days ago
      const retentionDays = 30

      expect(isExpired(createdAt, retentionDays)).toBe(false)
    })

    it('should return false just before expiration', () => {
      const now = new Date()
      // Set createdAt to just under retentionDays ago
      const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 29.5) // 29.5 days ago
      const retentionDays = 30

      expect(isExpired(createdAt, retentionDays)).toBe(false)
    })
  })

  describe('generatePreferenceToken', () => {
    it('should generate a 64-character hexadecimal token', () => {
      const token = generatePreferenceToken()

      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('should generate unique tokens', () => {
      const token1 = generatePreferenceToken()
      const token2 = generatePreferenceToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('buildListUnsubscribeHeader', () => {
    it('should build header with URL only', () => {
      const url = 'https://example.com/unsubscribe?token=abc123'

      const result = buildListUnsubscribeHeader(url)

      expect(result).toBe('<https://example.com/unsubscribe?token=abc123>')
    })

    it('should build header with URL and email', () => {
      const url = 'https://example.com/unsubscribe?token=abc123'
      const email = 'unsubscribe@example.com'

      const result = buildListUnsubscribeHeader(url, email)

      expect(result).toBe(
        '<https://example.com/unsubscribe?token=abc123>, <mailto:unsubscribe@example.com>'
      )
    })
  })

  describe('buildListUnsubscribePostHeader', () => {
    it('should return RFC 8058 compliant value', () => {
      const result = buildListUnsubscribePostHeader()

      expect(result).toBe('List-Unsubscribe=One-Click')
    })
  })

  describe('GDPR_CONFIG', () => {
    it('should have valid confirmation token settings', () => {
      expect(GDPR_CONFIG.CONFIRMATION_TOKEN_LENGTH).toBeGreaterThan(0)
      expect(GDPR_CONFIG.CONFIRMATION_TOKEN_EXPIRY_HOURS).toBeGreaterThan(0)
    })

    it('should have valid reminder settings', () => {
      expect(GDPR_CONFIG.MAX_REMINDER_COUNT).toBeGreaterThan(0)
      expect(GDPR_CONFIG.REMINDER_INTERVAL_DAYS).toBeGreaterThan(0)
    })

    it('should have valid default retention periods', () => {
      expect(GDPR_CONFIG.DEFAULT_RETENTION.contact).toBeGreaterThan(0)
      expect(GDPR_CONFIG.DEFAULT_RETENTION.consent).toBeGreaterThanOrEqual(
        GDPR_CONFIG.DEFAULT_RETENTION.contact
      )
      expect(GDPR_CONFIG.DEFAULT_RETENTION.order).toBeGreaterThan(0)
    })
  })
})
