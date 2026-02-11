import { describe, expect, it } from 'vitest'
import {
  SUPPRESSION_CONFIG,
  SUPPRESSION_REASON_LABELS,
  formatSuppressionCsv,
  isValidSuppressionEmail,
  normalizeEmail,
  parseSuppressionCsv,
  shouldSuppress
} from './suppression-list'
import type { BounceStats, SuppressionEntry } from './suppression-list'

describe('Suppression List', () => {
  describe('shouldSuppress', () => {
    it('should suppress after hard bounce threshold', () => {
      const stats: BounceStats = {
        contactId: 'c1',
        email: 'test@example.com',
        hardBounces: SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD,
        softBounces: 0
      }

      const result = shouldSuppress(stats)

      expect(result.suppress).toBe(true)
      expect(result.reason).toBe('hard_bounce')
    })

    it('should suppress after soft bounce threshold', () => {
      const stats: BounceStats = {
        contactId: 'c1',
        email: 'test@example.com',
        hardBounces: 0,
        softBounces: SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD
      }

      const result = shouldSuppress(stats)

      expect(result.suppress).toBe(true)
      expect(result.reason).toBe('soft_bounce_limit')
    })

    it('should not suppress below threshold', () => {
      const stats: BounceStats = {
        contactId: 'c1',
        email: 'test@example.com',
        hardBounces: 0,
        softBounces: SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD - 1
      }

      const result = shouldSuppress(stats)

      expect(result.suppress).toBe(false)
      expect(result.reason).toBeUndefined()
    })

    it('should prioritize hard bounce over soft bounce', () => {
      const stats: BounceStats = {
        contactId: 'c1',
        email: 'test@example.com',
        hardBounces: 1,
        softBounces: 5
      }

      const result = shouldSuppress(stats)

      expect(result.suppress).toBe(true)
      expect(result.reason).toBe('hard_bounce')
    })
  })

  describe('isValidSuppressionEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidSuppressionEmail('test@example.com')).toBe(true)
      expect(isValidSuppressionEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidSuppressionEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidSuppressionEmail('')).toBe(false)
      expect(isValidSuppressionEmail('not-an-email')).toBe(false)
      expect(isValidSuppressionEmail('missing@domain')).toBe(false)
      expect(isValidSuppressionEmail('@nodomain.com')).toBe(false)
    })
  })

  describe('normalizeEmail', () => {
    it('should lowercase and trim', () => {
      expect(normalizeEmail('  Test@EXAMPLE.com  ')).toBe('test@example.com')
    })
  })

  describe('parseSuppressionCsv', () => {
    it('should parse simple email list', () => {
      const content = `test1@example.com
test2@example.com
test3@example.com`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['test1@example.com', 'test2@example.com', 'test3@example.com'])
      expect(result.errors).toHaveLength(0)
    })

    it('should skip header row', () => {
      const content = `email,name
test@example.com,Test User`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['test@example.com'])
    })

    it('should extract email from CSV first column', () => {
      const content = `test@example.com,some,other,data
user@domain.com,more,data`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['test@example.com', 'user@domain.com'])
    })

    it('should handle quoted emails', () => {
      const content = `"test@example.com",data
'user@domain.com',more`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['test@example.com', 'user@domain.com'])
    })

    it('should report invalid emails', () => {
      const content = `valid@example.com
invalid-email
another@valid.org`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['valid@example.com', 'another@valid.org'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Line 2')
      expect(result.errors[0]).toContain('invalid-email')
    })

    it('should skip empty lines', () => {
      const content = `test1@example.com

test2@example.com

test3@example.com`

      const result = parseSuppressionCsv(content)

      expect(result.emails).toHaveLength(3)
    })

    it('should handle Windows line endings', () => {
      const content = 'test1@example.com\r\ntest2@example.com'

      const result = parseSuppressionCsv(content)

      expect(result.emails).toEqual(['test1@example.com', 'test2@example.com'])
    })
  })

  describe('formatSuppressionCsv', () => {
    const now = new Date('2024-01-15T10:00:00Z')

    it('should format entries as CSV', () => {
      const entries: SuppressionEntry[] = [
        {
          id: '1',
          email: 'test@example.com',
          reason: 'hard_bounce',
          source: 'campaign-123',
          createdAt: now
        }
      ]

      const csv = formatSuppressionCsv(entries)
      const lines = csv.split('\n')

      expect(lines[0]).toBe('email,reason,source,note,created_at')
      expect(lines[1]).toBe('test@example.com,hard_bounce,campaign-123,,2024-01-15T10:00:00.000Z')
    })

    it('should escape special characters', () => {
      const entries: SuppressionEntry[] = [
        {
          id: '1',
          email: 'test@example.com',
          reason: 'manual',
          note: 'Note with, comma and "quotes"',
          createdAt: now
        }
      ]

      const csv = formatSuppressionCsv(entries)

      expect(csv).toContain('"Note with, comma and ""quotes"""')
    })

    it('should handle missing optional fields', () => {
      const entries: SuppressionEntry[] = [
        {
          id: '1',
          email: 'test@example.com',
          reason: 'complaint',
          createdAt: now
        }
      ]

      const csv = formatSuppressionCsv(entries)
      const lines = csv.split('\n')

      expect(lines[1]).toBe('test@example.com,complaint,,,2024-01-15T10:00:00.000Z')
    })
  })

  describe('SUPPRESSION_REASON_LABELS', () => {
    it('should have labels for all reasons', () => {
      expect(SUPPRESSION_REASON_LABELS.hard_bounce).toBe('Hard Bounce')
      expect(SUPPRESSION_REASON_LABELS.soft_bounce_limit).toBe('Soft Bounce Limit Exceeded')
      expect(SUPPRESSION_REASON_LABELS.complaint).toBe('Spam Complaint')
      expect(SUPPRESSION_REASON_LABELS.unsubscribe).toBe('Unsubscribed')
      expect(SUPPRESSION_REASON_LABELS.manual).toBe('Manually Added')
    })
  })

  describe('SUPPRESSION_CONFIG', () => {
    it('should have reasonable defaults', () => {
      expect(SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD).toBe(1)
      expect(SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD).toBe(3)
    })
  })
})
