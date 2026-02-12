/**
 * CFP Settings Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type CfpSettings,
  type CfpUserRole,
  canViewSpeakerInfo,
  getAnonymousReviewMessage,
  getCfpStatus,
  getCfpStatusDisplay,
  getRemainingSubmissions,
  hasReachedSubmissionLimit,
  isCfpOpen,
  isFinalStatus,
  validateCfpDates
} from './cfp-settings'

// Test fixtures
const createSettings = (
  overrides?: Partial<CfpSettings>
): Pick<CfpSettings, 'anonymousReview' | 'revealSpeakersAfterDecision'> => ({
  anonymousReview: false,
  revealSpeakersAfterDecision: true,
  ...overrides
})

describe('isFinalStatus', () => {
  it('should return true for accepted status', () => {
    expect(isFinalStatus('accepted')).toBe(true)
  })

  it('should return true for rejected status', () => {
    expect(isFinalStatus('rejected')).toBe(true)
  })

  it('should return true for confirmed status', () => {
    expect(isFinalStatus('confirmed')).toBe(true)
  })

  it('should return true for declined status', () => {
    expect(isFinalStatus('declined')).toBe(true)
  })

  it('should return true for withdrawn status', () => {
    expect(isFinalStatus('withdrawn')).toBe(true)
  })

  it('should return false for draft status', () => {
    expect(isFinalStatus('draft')).toBe(false)
  })

  it('should return false for submitted status', () => {
    expect(isFinalStatus('submitted')).toBe(false)
  })

  it('should return false for under_review status', () => {
    expect(isFinalStatus('under_review')).toBe(false)
  })
})

describe('canViewSpeakerInfo', () => {
  describe('when anonymous review is disabled', () => {
    it('should return true regardless of role', () => {
      const settings = createSettings({ anonymousReview: false })

      expect(canViewSpeakerInfo(settings, 'reviewer')).toBe(true)
      expect(canViewSpeakerInfo(settings, 'member')).toBe(true)
      expect(canViewSpeakerInfo(settings, null)).toBe(true)
    })
  })

  describe('when anonymous review is enabled', () => {
    it('should return true for owner', () => {
      const settings = createSettings({ anonymousReview: true })
      expect(canViewSpeakerInfo(settings, 'owner')).toBe(true)
    })

    it('should return true for admin', () => {
      const settings = createSettings({ anonymousReview: true })
      expect(canViewSpeakerInfo(settings, 'admin')).toBe(true)
    })

    it('should return false for reviewer without final status', () => {
      const settings = createSettings({ anonymousReview: true })
      expect(canViewSpeakerInfo(settings, 'reviewer')).toBe(false)
      expect(canViewSpeakerInfo(settings, 'reviewer', 'submitted')).toBe(false)
      expect(canViewSpeakerInfo(settings, 'reviewer', 'under_review')).toBe(false)
    })

    it('should return true for reviewer with final status when revealSpeakersAfterDecision is true', () => {
      const settings = createSettings({
        anonymousReview: true,
        revealSpeakersAfterDecision: true
      })

      expect(canViewSpeakerInfo(settings, 'reviewer', 'accepted')).toBe(true)
      expect(canViewSpeakerInfo(settings, 'reviewer', 'rejected')).toBe(true)
      expect(canViewSpeakerInfo(settings, 'reviewer', 'confirmed')).toBe(true)
    })

    it('should return false for reviewer with final status when revealSpeakersAfterDecision is false', () => {
      const settings = createSettings({
        anonymousReview: true,
        revealSpeakersAfterDecision: false
      })

      expect(canViewSpeakerInfo(settings, 'reviewer', 'accepted')).toBe(false)
      expect(canViewSpeakerInfo(settings, 'reviewer', 'rejected')).toBe(false)
    })

    it('should return false for member role', () => {
      const settings = createSettings({ anonymousReview: true })
      expect(canViewSpeakerInfo(settings, 'member')).toBe(false)
    })

    it('should return false for null role', () => {
      const settings = createSettings({ anonymousReview: true })
      expect(canViewSpeakerInfo(settings, null)).toBe(false)
    })
  })

  describe('when settings is null', () => {
    it('should return true (default to showing speaker info)', () => {
      expect(canViewSpeakerInfo(null, 'reviewer')).toBe(true)
      expect(canViewSpeakerInfo(null, null)).toBe(true)
    })
  })
})

describe('getAnonymousReviewMessage', () => {
  it('should return null when speaker info is visible', () => {
    const settings = createSettings({ anonymousReview: false })
    expect(getAnonymousReviewMessage(settings, 'reviewer')).toBeNull()
  })

  it('should return message about reveal after decision when enabled', () => {
    const settings = createSettings({
      anonymousReview: true,
      revealSpeakersAfterDecision: true
    })
    const message = getAnonymousReviewMessage(settings, 'reviewer')

    expect(message).toContain('hidden during anonymous review')
    expect(message).toContain('revealed after a decision')
  })

  it('should return message about admin access when reveal is disabled', () => {
    const settings = createSettings({
      anonymousReview: true,
      revealSpeakersAfterDecision: false
    })
    const message = getAnonymousReviewMessage(settings, 'reviewer')

    expect(message).toContain('hidden during anonymous review')
    expect(message).toContain('Only admins and owners')
  })
})

describe('isCfpOpen', () => {
  it('should return false when settings is null', () => {
    expect(isCfpOpen(null)).toBe(false)
  })

  it('should return true when no dates are set', () => {
    expect(isCfpOpen({})).toBe(true)
  })

  it('should return false when before open date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    expect(isCfpOpen({ cfpOpenDate: tomorrow })).toBe(false)
  })

  it('should return true when after open date and no close date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    expect(isCfpOpen({ cfpOpenDate: yesterday })).toBe(true)
  })

  it('should return false when after close date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    expect(isCfpOpen({ cfpCloseDate: yesterday })).toBe(false)
  })

  it('should return true when between open and close dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    expect(isCfpOpen({ cfpOpenDate: yesterday, cfpCloseDate: tomorrow })).toBe(true)
  })
})

describe('getCfpStatus', () => {
  it('should return not_configured when settings is null', () => {
    expect(getCfpStatus(null)).toBe('not_configured')
  })

  it('should return not_configured when no dates are set', () => {
    expect(getCfpStatus({})).toBe('not_configured')
  })

  it('should return not_yet_open when before open date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    expect(getCfpStatus({ cfpOpenDate: tomorrow })).toBe('not_yet_open')
  })

  it('should return open when after open date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    expect(getCfpStatus({ cfpOpenDate: yesterday })).toBe('open')
  })

  it('should return closed when after close date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    expect(getCfpStatus({ cfpCloseDate: yesterday })).toBe('closed')
  })
})

describe('getCfpStatusDisplay', () => {
  it('should return not configured status', () => {
    const result = getCfpStatusDisplay(null)

    expect(result.label).toBe('Not Configured')
    expect(result.color).toBe('#94a3b8')
  })

  it('should return coming soon status', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = getCfpStatusDisplay({ cfpOpenDate: tomorrow })

    expect(result.label).toBe('Coming Soon')
    expect(result.color).toBe('#f59e0b')
  })

  it('should return open status', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const result = getCfpStatusDisplay({ cfpOpenDate: yesterday })

    expect(result.label).toBe('Open')
    expect(result.color).toBe('#22c55e')
  })

  it('should return closed status', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const result = getCfpStatusDisplay({ cfpCloseDate: yesterday })

    expect(result.label).toBe('Closed')
    expect(result.color).toBe('#ef4444')
  })
})

describe('validateCfpDates', () => {
  it('should return valid when no dates provided', () => {
    const result = validateCfpDates(undefined, undefined)
    expect(result.valid).toBe(true)
  })

  it('should return valid when only open date provided', () => {
    const result = validateCfpDates(new Date(), undefined)
    expect(result.valid).toBe(true)
  })

  it('should return valid when only close date provided', () => {
    const result = validateCfpDates(undefined, new Date())
    expect(result.valid).toBe(true)
  })

  it('should return valid when close date is after open date', () => {
    const openDate = new Date('2025-01-01')
    const closeDate = new Date('2025-01-15')

    const result = validateCfpDates(openDate, closeDate)
    expect(result.valid).toBe(true)
  })

  it('should return invalid when close date is before open date', () => {
    const openDate = new Date('2025-01-15')
    const closeDate = new Date('2025-01-01')

    const result = validateCfpDates(openDate, closeDate)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Close date must be after open date')
  })

  it('should return invalid when close date equals open date', () => {
    const date = new Date('2025-01-15')

    const result = validateCfpDates(date, date)
    expect(result.valid).toBe(false)
  })
})

describe('hasReachedSubmissionLimit', () => {
  it('should return true when at limit', () => {
    expect(hasReachedSubmissionLimit(3, 3)).toBe(true)
  })

  it('should return true when over limit', () => {
    expect(hasReachedSubmissionLimit(5, 3)).toBe(true)
  })

  it('should return false when under limit', () => {
    expect(hasReachedSubmissionLimit(2, 3)).toBe(false)
  })

  it('should return false when no submissions', () => {
    expect(hasReachedSubmissionLimit(0, 3)).toBe(false)
  })
})

describe('getRemainingSubmissions', () => {
  it('should return correct remaining when under limit', () => {
    expect(getRemainingSubmissions(1, 3)).toBe(2)
  })

  it('should return 0 when at limit', () => {
    expect(getRemainingSubmissions(3, 3)).toBe(0)
  })

  it('should return 0 when over limit', () => {
    expect(getRemainingSubmissions(5, 3)).toBe(0)
  })

  it('should return max when no submissions', () => {
    expect(getRemainingSubmissions(0, 3)).toBe(3)
  })
})
