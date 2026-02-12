/**
 * Secret Link Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  SECRET_LINK_PREFIX,
  SECRET_LINK_TOKEN_LENGTH,
  type SecretLink,
  buildSecretLinkUrl,
  formatExpiryDate,
  formatSubmissionLimit,
  generateSecretToken,
  getRemainingSubmissions,
  getSecretLinkErrorMessage,
  getSecretLinkStatus,
  getSecretLinkStatusColor,
  getSecretLinkStatusLabel,
  hasReachedSubmissionLimit,
  isSecretLinkExpired,
  isValidTokenFormat,
  validateSecretLink
} from './secret-link'

// Test fixtures
const createLink = (overrides?: Partial<SecretLink>): SecretLink => ({
  id: 'link-001',
  editionId: 'edition-001',
  token: 'cfp_abcdefghijklmnopqrstuvwxyz123456',
  name: 'VIP Speaker Link',
  isActive: true,
  usedSubmissions: 0,
  createdBy: 'user-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Token Generation', () => {
  describe('generateSecretToken', () => {
    it('should generate a token with correct prefix', () => {
      const token = generateSecretToken()
      expect(token.startsWith(SECRET_LINK_PREFIX)).toBe(true)
    })

    it('should generate a token with correct length', () => {
      const token = generateSecretToken()
      const tokenPart = token.slice(SECRET_LINK_PREFIX.length)
      expect(tokenPart.length).toBe(SECRET_LINK_TOKEN_LENGTH)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecretToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should only contain alphanumeric characters', () => {
      const token = generateSecretToken()
      const tokenPart = token.slice(SECRET_LINK_PREFIX.length)
      expect(/^[A-Za-z0-9]+$/.test(tokenPart)).toBe(true)
    })
  })

  describe('isValidTokenFormat', () => {
    it('should validate correct token format', () => {
      expect(isValidTokenFormat('cfp_abcdefghijklmnopqrstuvwxyz123456')).toBe(true)
    })

    it('should reject token without prefix', () => {
      expect(isValidTokenFormat('abcdefghijklmnopqrstuvwxyz123456')).toBe(false)
    })

    it('should reject token with wrong prefix', () => {
      expect(isValidTokenFormat('xyz_abcdefghijklmnopqrstuvwxyz123456')).toBe(false)
    })

    it('should reject token with wrong length', () => {
      expect(isValidTokenFormat('cfp_abc')).toBe(false)
    })

    it('should reject token with special characters', () => {
      expect(isValidTokenFormat('cfp_abc-def-ghi-jkl-mno-pqr-stu-vwx')).toBe(false)
    })
  })
})

describe('Expiration Functions', () => {
  describe('isSecretLinkExpired', () => {
    it('should return false for link without expiry', () => {
      const link = createLink({ expiresAt: undefined })
      expect(isSecretLinkExpired(link)).toBe(false)
    })

    it('should return false for link with future expiry', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const link = createLink({ expiresAt: tomorrow })
      expect(isSecretLinkExpired(link)).toBe(false)
    })

    it('should return true for link with past expiry', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const link = createLink({ expiresAt: yesterday })
      expect(isSecretLinkExpired(link)).toBe(true)
    })
  })
})

describe('Submission Limit Functions', () => {
  describe('hasReachedSubmissionLimit', () => {
    it('should return false for link without limit', () => {
      const link = createLink({ maxSubmissions: undefined })
      expect(hasReachedSubmissionLimit(link)).toBe(false)
    })

    it('should return false when under limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 2 })
      expect(hasReachedSubmissionLimit(link)).toBe(false)
    })

    it('should return true when at limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 5 })
      expect(hasReachedSubmissionLimit(link)).toBe(true)
    })

    it('should return true when over limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 7 })
      expect(hasReachedSubmissionLimit(link)).toBe(true)
    })
  })

  describe('getRemainingSubmissions', () => {
    it('should return null for unlimited link', () => {
      const link = createLink({ maxSubmissions: undefined })
      expect(getRemainingSubmissions(link)).toBeNull()
    })

    it('should return remaining count', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 2 })
      expect(getRemainingSubmissions(link)).toBe(3)
    })

    it('should return 0 when at limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 5 })
      expect(getRemainingSubmissions(link)).toBe(0)
    })

    it('should return 0 when over limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 7 })
      expect(getRemainingSubmissions(link)).toBe(0)
    })
  })
})

describe('validateSecretLink', () => {
  it('should return valid for active link', () => {
    const link = createLink()
    const result = validateSecretLink(link)

    expect(result.valid).toBe(true)
    expect(result.link).toBe(link)
    expect(result.error).toBeUndefined()
  })

  it('should return not_found for null link', () => {
    const result = validateSecretLink(null)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('not_found')
  })

  it('should return inactive for deactivated link', () => {
    const link = createLink({ isActive: false })
    const result = validateSecretLink(link)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('inactive')
    expect(result.link).toBe(link)
  })

  it('should return expired for past expiry', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const link = createLink({ expiresAt: yesterday })
    const result = validateSecretLink(link)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('expired')
  })

  it('should return limit_reached when at limit', () => {
    const link = createLink({ maxSubmissions: 5, usedSubmissions: 5 })
    const result = validateSecretLink(link)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('limit_reached')
  })

  it('should check inactive before expired', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const link = createLink({ isActive: false, expiresAt: yesterday })
    const result = validateSecretLink(link)

    expect(result.error).toBe('inactive')
  })
})

describe('Error Messages', () => {
  describe('getSecretLinkErrorMessage', () => {
    it('should return message for not_found', () => {
      expect(getSecretLinkErrorMessage('not_found')).toContain('invalid')
    })

    it('should return message for expired', () => {
      expect(getSecretLinkErrorMessage('expired')).toContain('expired')
    })

    it('should return message for limit_reached', () => {
      expect(getSecretLinkErrorMessage('limit_reached')).toContain('maximum')
    })

    it('should return message for inactive', () => {
      expect(getSecretLinkErrorMessage('inactive')).toContain('deactivated')
    })

    it('should return message for invalid_token', () => {
      expect(getSecretLinkErrorMessage('invalid_token')).toContain('format')
    })
  })
})

describe('Status Functions', () => {
  describe('getSecretLinkStatus', () => {
    it('should return active for valid link', () => {
      const link = createLink()
      expect(getSecretLinkStatus(link)).toBe('active')
    })

    it('should return inactive for deactivated link', () => {
      const link = createLink({ isActive: false })
      expect(getSecretLinkStatus(link)).toBe('inactive')
    })

    it('should return expired for past expiry', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const link = createLink({ expiresAt: yesterday })
      expect(getSecretLinkStatus(link)).toBe('expired')
    })

    it('should return limit_reached when at limit', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 5 })
      expect(getSecretLinkStatus(link)).toBe('limit_reached')
    })
  })

  describe('getSecretLinkStatusLabel', () => {
    it('should return Active for active link', () => {
      const link = createLink()
      expect(getSecretLinkStatusLabel(link)).toBe('Active')
    })

    it('should return Inactive for inactive link', () => {
      const link = createLink({ isActive: false })
      expect(getSecretLinkStatusLabel(link)).toBe('Inactive')
    })

    it('should return Expired for expired link', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const link = createLink({ expiresAt: yesterday })
      expect(getSecretLinkStatusLabel(link)).toBe('Expired')
    })
  })

  describe('getSecretLinkStatusColor', () => {
    it('should return green for active', () => {
      const link = createLink()
      expect(getSecretLinkStatusColor(link)).toContain('22c55e')
    })

    it('should return slate for inactive', () => {
      const link = createLink({ isActive: false })
      expect(getSecretLinkStatusColor(link)).toContain('94a3b8')
    })
  })
})

describe('URL Building', () => {
  describe('buildSecretLinkUrl', () => {
    it('should build correct URL', () => {
      const url = buildSecretLinkUrl('https://example.com', 'conf-2025', 'cfp_abc123')

      expect(url).toBe('https://example.com/cfp/conf-2025/submit?token=cfp_abc123')
    })

    it('should handle trailing slash in base URL', () => {
      const url = buildSecretLinkUrl('https://example.com/', 'conf-2025', 'cfp_abc123')

      expect(url).toBe('https://example.com//cfp/conf-2025/submit?token=cfp_abc123')
    })
  })
})

describe('Display Functions', () => {
  describe('formatExpiryDate', () => {
    it('should return Never for undefined date', () => {
      expect(formatExpiryDate(undefined)).toBe('Never')
    })

    it('should format date correctly', () => {
      const date = new Date('2025-06-15T14:30:00')
      const formatted = formatExpiryDate(date)

      expect(formatted).toContain('Jun')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2025')
    })
  })

  describe('formatSubmissionLimit', () => {
    it('should return Unlimited for no limit', () => {
      const link = createLink({ maxSubmissions: undefined })
      expect(formatSubmissionLimit(link)).toBe('Unlimited')
    })

    it('should return usage fraction', () => {
      const link = createLink({ maxSubmissions: 5, usedSubmissions: 2 })
      expect(formatSubmissionLimit(link)).toBe('2/5')
    })
  })
})
