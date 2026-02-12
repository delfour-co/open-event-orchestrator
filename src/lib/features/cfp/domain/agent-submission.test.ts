/**
 * Agent Submission Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type AgentSubmission,
  buildAgentNotificationContext,
  calculateAgentSubmissionStats,
  calculateValidationExpiry,
  filterByOrigin,
  filterByValidationStatus,
  formatAttribution,
  formatValidationExpiry,
  generateValidationToken,
  getAgentSubmissionEmailSubject,
  getOriginIcon,
  getOriginLabel,
  getRemainingValidationTime,
  getSubmissionsNeedingAction,
  getValidationStatusColor,
  getValidationStatusLabel,
  isAgentSubmission,
  isPendingValidation,
  isRejectedByPeaker,
  isValidTokenFormat,
  isValidated,
  isValidationActive,
  isValidationExpired,
  markAsExpired,
  needsNotification,
  needsReminder,
  processSpeakerValidation,
  sortByDate,
  validateAgentSubmission,
  validateCreateAgentSubmission,
  validateSpeakerValidationInput
} from './agent-submission'

// Test fixtures
const createSubmission = (overrides?: Partial<AgentSubmission>): AgentSubmission => ({
  id: 'agent-001',
  talkId: 'talk-001',
  speakerId: 'speaker-001',
  submittedBy: 'user-001',
  submittedByName: 'John Organizer',
  submittedByEmail: 'john@example.com',
  origin: 'organizer',
  validationStatus: 'pending',
  validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
  validationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: new Date('2025-06-01T10:00:00Z'),
  updatedAt: new Date('2025-06-01T10:00:00Z'),
  ...overrides
})

describe('Status Check Functions', () => {
  describe('isPendingValidation', () => {
    it('should return true for pending status', () => {
      const submission = createSubmission({ validationStatus: 'pending' })
      expect(isPendingValidation(submission)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(isPendingValidation(createSubmission({ validationStatus: 'validated' }))).toBe(false)
      expect(isPendingValidation(createSubmission({ validationStatus: 'rejected' }))).toBe(false)
    })
  })

  describe('isValidated', () => {
    it('should return true for validated status', () => {
      const submission = createSubmission({ validationStatus: 'validated' })
      expect(isValidated(submission)).toBe(true)
    })
  })

  describe('isRejectedByPeaker', () => {
    it('should return true for rejected status', () => {
      const submission = createSubmission({ validationStatus: 'rejected' })
      expect(isRejectedByPeaker(submission)).toBe(true)
    })
  })

  describe('isValidationExpired', () => {
    it('should return true when past expiry', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: pastDate
      })
      expect(isValidationExpired(submission)).toBe(true)
    })

    it('should return false when before expiry', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: futureDate
      })
      expect(isValidationExpired(submission)).toBe(false)
    })

    it('should return false for non-pending submissions', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const submission = createSubmission({
        validationStatus: 'validated',
        validationExpiresAt: pastDate
      })
      expect(isValidationExpired(submission)).toBe(false)
    })
  })

  describe('isValidationActive', () => {
    it('should return true for pending and not expired', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: futureDate
      })
      expect(isValidationActive(submission)).toBe(true)
    })

    it('should return false for expired', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: pastDate
      })
      expect(isValidationActive(submission)).toBe(false)
    })
  })

  describe('isAgentSubmission', () => {
    it('should return true for organizer origin', () => {
      const submission = createSubmission({ origin: 'organizer' })
      expect(isAgentSubmission(submission)).toBe(true)
    })

    it('should return true for import origin', () => {
      const submission = createSubmission({ origin: 'import' })
      expect(isAgentSubmission(submission)).toBe(true)
    })

    it('should return false for speaker origin', () => {
      const submission = createSubmission({ origin: 'speaker' })
      expect(isAgentSubmission(submission)).toBe(false)
    })
  })

  describe('needsNotification', () => {
    it('should return true for pending without notification', () => {
      const submission = createSubmission({
        validationStatus: 'pending',
        notificationSentAt: undefined
      })
      expect(needsNotification(submission)).toBe(true)
    })

    it('should return false if already notified', () => {
      const submission = createSubmission({
        validationStatus: 'pending',
        notificationSentAt: new Date()
      })
      expect(needsNotification(submission)).toBe(false)
    })

    it('should return false for non-pending', () => {
      const submission = createSubmission({
        validationStatus: 'validated'
      })
      expect(needsNotification(submission)).toBe(false)
    })
  })

  describe('needsReminder', () => {
    it('should return true after threshold days', () => {
      const notifiedAt = new Date()
      notifiedAt.setDate(notifiedAt.getDate() - 4) // 4 days ago

      const submission = createSubmission({
        validationStatus: 'pending',
        notificationSentAt: notifiedAt,
        reminderSentAt: undefined
      })
      expect(needsReminder(submission, 3)).toBe(true)
    })

    it('should return false before threshold', () => {
      const notifiedAt = new Date()
      notifiedAt.setDate(notifiedAt.getDate() - 1) // 1 day ago

      const submission = createSubmission({
        validationStatus: 'pending',
        notificationSentAt: notifiedAt,
        reminderSentAt: undefined
      })
      expect(needsReminder(submission, 3)).toBe(false)
    })

    it('should return false if reminder already sent', () => {
      const notifiedAt = new Date()
      notifiedAt.setDate(notifiedAt.getDate() - 4)

      const submission = createSubmission({
        validationStatus: 'pending',
        notificationSentAt: notifiedAt,
        reminderSentAt: new Date()
      })
      expect(needsReminder(submission, 3)).toBe(false)
    })
  })
})

describe('Token Functions', () => {
  describe('generateValidationToken', () => {
    it('should generate 32 character token', () => {
      const token = generateValidationToken()
      expect(token).toHaveLength(32)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateValidationToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should only contain lowercase alphanumeric', () => {
      const token = generateValidationToken()
      expect(token).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('calculateValidationExpiry', () => {
    it('should add default 7 days', () => {
      const now = new Date()
      const expiry = calculateValidationExpiry()
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(6.9)
      expect(diffDays).toBeLessThan(7.1)
    })

    it('should add custom days', () => {
      const now = new Date()
      const expiry = calculateValidationExpiry(14)
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(13.9)
      expect(diffDays).toBeLessThan(14.1)
    })
  })

  describe('isValidTokenFormat', () => {
    it('should validate correct token', () => {
      expect(isValidTokenFormat('abcdefghijklmnopqrstuvwxyz012345')).toBe(true)
    })

    it('should reject short token', () => {
      expect(isValidTokenFormat('abc123')).toBe(false)
    })

    it('should reject token with uppercase', () => {
      expect(isValidTokenFormat('ABCDEFGHIJKLMNOPQRSTUVWXYZ012345')).toBe(false)
    })

    it('should reject token with special chars', () => {
      expect(isValidTokenFormat('abc-efgh-jklm-opqr-tuvw-yz01-345')).toBe(false)
    })
  })
})

describe('Display Functions', () => {
  describe('getValidationStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getValidationStatusLabel('pending')).toBe('Pending Validation')
      expect(getValidationStatusLabel('validated')).toBe('Validated')
      expect(getValidationStatusLabel('rejected')).toBe('Rejected')
      expect(getValidationStatusLabel('expired')).toBe('Expired')
    })
  })

  describe('getValidationStatusColor', () => {
    it('should return correct colors', () => {
      expect(getValidationStatusColor('pending')).toBe('yellow')
      expect(getValidationStatusColor('validated')).toBe('green')
      expect(getValidationStatusColor('rejected')).toBe('red')
      expect(getValidationStatusColor('expired')).toBe('gray')
    })
  })

  describe('getOriginLabel', () => {
    it('should return correct labels', () => {
      expect(getOriginLabel('speaker')).toBe('Direct Submission')
      expect(getOriginLabel('organizer')).toBe('Submitted by Organizer')
      expect(getOriginLabel('import')).toBe('Imported')
      expect(getOriginLabel('invitation')).toBe('From Invitation')
    })
  })

  describe('getOriginIcon', () => {
    it('should return correct icons', () => {
      expect(getOriginIcon('speaker')).toBe('user')
      expect(getOriginIcon('organizer')).toBe('user-cog')
      expect(getOriginIcon('import')).toBe('file-import')
      expect(getOriginIcon('invitation')).toBe('mail')
    })
  })

  describe('formatAttribution', () => {
    it('should format organizer submission', () => {
      const submission = createSubmission({
        origin: 'organizer',
        submittedByName: 'Jane Admin'
      })
      expect(formatAttribution(submission)).toBe('Submitted by Jane Admin')
    })

    it('should format direct speaker submission', () => {
      const submission = createSubmission({ origin: 'speaker' })
      expect(formatAttribution(submission)).toBe('Submitted directly')
    })

    it('should format import submission', () => {
      const submission = createSubmission({
        origin: 'import',
        submittedByName: 'Admin User'
      })
      expect(formatAttribution(submission)).toBe('Imported by Admin User')
    })

    it('should format invitation submission', () => {
      const submission = createSubmission({ origin: 'invitation' })
      expect(formatAttribution(submission)).toBe('From speaker invitation')
    })
  })
})

describe('Time Functions', () => {
  describe('getRemainingValidationTime', () => {
    it('should calculate remaining time', () => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 2)
      expiresAt.setHours(expiresAt.getHours() + 5)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: expiresAt
      })

      const result = getRemainingValidationTime(submission)

      expect(result.hasTime).toBe(true)
      expect(result.days).toBe(2)
      expect(result.hours).toBeGreaterThanOrEqual(4)
    })

    it('should return expired for past time', () => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() - 1)

      const submission = createSubmission({
        validationStatus: 'pending',
        validationExpiresAt: expiresAt
      })

      const result = getRemainingValidationTime(submission)

      expect(result.hasTime).toBe(false)
      expect(result.formatted).toBe('Expired')
    })

    it('should return N/A for non-pending', () => {
      const submission = createSubmission({ validationStatus: 'validated' })

      const result = getRemainingValidationTime(submission)

      expect(result.hasTime).toBe(false)
      expect(result.formatted).toBe('N/A')
    })
  })

  describe('formatValidationExpiry', () => {
    it('should format date', () => {
      const date = new Date('2025-06-15')
      const formatted = formatValidationExpiry(date)
      expect(formatted).toContain('Jun')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2025')
    })
  })
})

describe('Notification Functions', () => {
  describe('getAgentSubmissionEmailSubject', () => {
    it('should return initial notification subject', () => {
      const subject = getAgentSubmissionEmailSubject('initial', 'My Talk Title')
      expect(subject).toContain('Review required')
      expect(subject).toContain('My Talk Title')
    })

    it('should return reminder subject', () => {
      const subject = getAgentSubmissionEmailSubject('reminder', 'My Talk Title')
      expect(subject).toContain('Reminder')
    })

    it('should return validated subject', () => {
      const subject = getAgentSubmissionEmailSubject('validated', 'My Talk Title')
      expect(subject).toContain('validated')
    })

    it('should return rejected subject', () => {
      const subject = getAgentSubmissionEmailSubject('rejected', 'My Talk Title')
      expect(subject).toContain('rejected')
    })
  })

  describe('buildAgentNotificationContext', () => {
    it('should build context object', () => {
      const submission = createSubmission()
      const context = buildAgentNotificationContext(
        submission,
        'My Talk',
        'Tech Conf',
        'Jane Speaker',
        'https://example.com/validate/abc'
      )

      expect(context.speakerName).toBe('Jane Speaker')
      expect(context.talkTitle).toBe('My Talk')
      expect(context.eventName).toBe('Tech Conf')
      expect(context.submittedByName).toBe('John Organizer')
      expect(context.validationUrl).toBe('https://example.com/validate/abc')
    })
  })
})

describe('Validation Action Functions', () => {
  describe('processSpeakerValidation', () => {
    it('should validate with correct token', () => {
      const submission = createSubmission({
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
        validationStatus: 'pending'
      })

      const result = processSpeakerValidation(submission, {
        token: 'abcdefghijklmnopqrstuvwxyz012345',
        action: 'validate'
      })

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('validated')
    })

    it('should reject with correct token', () => {
      const submission = createSubmission({
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
        validationStatus: 'pending'
      })

      const result = processSpeakerValidation(submission, {
        token: 'abcdefghijklmnopqrstuvwxyz012345',
        action: 'reject',
        notes: 'Not my talk'
      })

      expect(result.success).toBe(true)
      expect(result.newStatus).toBe('rejected')
    })

    it('should fail with wrong token', () => {
      const submission = createSubmission({
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345'
      })

      const result = processSpeakerValidation(submission, {
        token: 'wrongtokenwrongtokenwrongtoken12',
        action: 'validate'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should fail if not pending', () => {
      const submission = createSubmission({
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
        validationStatus: 'validated'
      })

      const result = processSpeakerValidation(submission, {
        token: 'abcdefghijklmnopqrstuvwxyz012345',
        action: 'validate'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not pending')
    })

    it('should fail if expired', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const submission = createSubmission({
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
        validationStatus: 'pending',
        validationExpiresAt: pastDate
      })

      const result = processSpeakerValidation(submission, {
        token: 'abcdefghijklmnopqrstuvwxyz012345',
        action: 'validate'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
    })
  })

  describe('markAsExpired', () => {
    it('should return expired status update', () => {
      const submission = createSubmission({ validationStatus: 'pending' })
      const update = markAsExpired(submission)

      expect(update.validationStatus).toBe('expired')
    })

    it('should throw for non-pending', () => {
      const submission = createSubmission({ validationStatus: 'validated' })
      expect(() => markAsExpired(submission)).toThrow()
    })
  })
})

describe('Query Functions', () => {
  describe('filterByValidationStatus', () => {
    it('should filter by status', () => {
      const submissions = [
        createSubmission({ id: '1', validationStatus: 'pending' }),
        createSubmission({ id: '2', validationStatus: 'validated' }),
        createSubmission({ id: '3', validationStatus: 'pending' })
      ]

      const pending = filterByValidationStatus(submissions, 'pending')

      expect(pending).toHaveLength(2)
    })
  })

  describe('filterByOrigin', () => {
    it('should filter by origin', () => {
      const submissions = [
        createSubmission({ id: '1', origin: 'organizer' }),
        createSubmission({ id: '2', origin: 'speaker' }),
        createSubmission({ id: '3', origin: 'organizer' })
      ]

      const organizer = filterByOrigin(submissions, 'organizer')

      expect(organizer).toHaveLength(2)
    })
  })

  describe('getSubmissionsNeedingAction', () => {
    it('should categorize submissions', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const oldNotification = new Date()
      oldNotification.setDate(oldNotification.getDate() - 5)

      const submissions = [
        createSubmission({ id: '1', validationStatus: 'pending', notificationSentAt: undefined }),
        createSubmission({
          id: '2',
          validationStatus: 'pending',
          notificationSentAt: oldNotification
        }),
        createSubmission({
          id: '3',
          validationStatus: 'pending',
          validationExpiresAt: pastDate,
          notificationSentAt: oldNotification,
          reminderSentAt: oldNotification
        })
      ]

      const result = getSubmissionsNeedingAction(submissions)

      expect(result.needNotification).toHaveLength(1)
      expect(result.needReminder).toHaveLength(1)
      expect(result.expired).toHaveLength(1)
    })
  })

  describe('sortByDate', () => {
    it('should sort by date descending', () => {
      const submissions = [
        createSubmission({ id: '1', createdAt: new Date('2025-06-01') }),
        createSubmission({ id: '2', createdAt: new Date('2025-06-03') }),
        createSubmission({ id: '3', createdAt: new Date('2025-06-02') })
      ]

      const sorted = sortByDate(submissions)

      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })
  })
})

describe('Statistics Functions', () => {
  describe('calculateAgentSubmissionStats', () => {
    it('should calculate correct statistics', () => {
      const submissions = [
        createSubmission({ id: '1', validationStatus: 'pending', origin: 'organizer' }),
        createSubmission({
          id: '2',
          validationStatus: 'validated',
          origin: 'organizer',
          validatedAt: new Date()
        }),
        createSubmission({ id: '3', validationStatus: 'rejected', origin: 'import' }),
        createSubmission({ id: '4', validationStatus: 'expired', origin: 'invitation' })
      ]

      const stats = calculateAgentSubmissionStats(submissions)

      expect(stats.total).toBe(4)
      expect(stats.byStatus.pending).toBe(1)
      expect(stats.byStatus.validated).toBe(1)
      expect(stats.byStatus.rejected).toBe(1)
      expect(stats.byStatus.expired).toBe(1)
      expect(stats.byOrigin.organizer).toBe(2)
      expect(stats.validationRate).toBe(50)
    })

    it('should handle empty list', () => {
      const stats = calculateAgentSubmissionStats([])

      expect(stats.total).toBe(0)
      expect(stats.validationRate).toBe(0)
    })
  })
})

describe('Validation Functions', () => {
  describe('validateAgentSubmission', () => {
    it('should validate correct submission', () => {
      const submission = createSubmission()
      expect(() => validateAgentSubmission(submission)).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() =>
        validateAgentSubmission({
          ...createSubmission(),
          submittedByEmail: 'not-an-email'
        })
      ).toThrow()
    })
  })

  describe('validateCreateAgentSubmission', () => {
    it('should validate create input', () => {
      const input = {
        talkId: 'talk-001',
        speakerId: 'speaker-001',
        submittedBy: 'user-001',
        submittedByName: 'John Organizer',
        submittedByEmail: 'john@example.com',
        origin: 'organizer',
        validationToken: 'abcdefghijklmnopqrstuvwxyz012345',
        validationExpiresAt: new Date()
      }

      expect(() => validateCreateAgentSubmission(input)).not.toThrow()
    })
  })

  describe('validateSpeakerValidationInput', () => {
    it('should validate correct input', () => {
      const input = {
        token: 'abcdefghijklmnopqrstuvwxyz012345',
        action: 'validate'
      }

      const result = validateSpeakerValidationInput(input)

      expect(result.token).toBe('abcdefghijklmnopqrstuvwxyz012345')
      expect(result.action).toBe('validate')
    })

    it('should reject invalid action', () => {
      expect(() =>
        validateSpeakerValidationInput({
          token: 'abcdefghijklmnopqrstuvwxyz012345',
          action: 'invalid'
        })
      ).toThrow()
    })

    it('should reject invalid token length', () => {
      expect(() =>
        validateSpeakerValidationInput({
          token: 'short',
          action: 'validate'
        })
      ).toThrow()
    })
  })
})
