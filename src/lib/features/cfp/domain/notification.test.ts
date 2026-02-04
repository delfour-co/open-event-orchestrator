import { describe, expect, it } from 'vitest'
import {
  createEmailLogSchema,
  emailLogSchema,
  getNotificationSubject,
  getNotificationTypeLabel,
  notificationTypeSchema
} from './notification'

describe('notification domain', () => {
  describe('notificationTypeSchema', () => {
    it('should accept valid notification types', () => {
      const types = [
        'submission_confirmed',
        'talk_accepted',
        'talk_rejected',
        'confirmation_reminder',
        'cfp_closing_reminder',
        'cospeaker_invitation'
      ]
      for (const type of types) {
        expect(notificationTypeSchema.safeParse(type).success).toBe(true)
      }
    })

    it('should reject invalid notification types', () => {
      expect(notificationTypeSchema.safeParse('invalid').success).toBe(false)
      expect(notificationTypeSchema.safeParse('').success).toBe(false)
    })
  })

  describe('emailLogSchema', () => {
    it('should validate a complete email log', () => {
      const log = {
        id: 'log-1',
        talkId: 'talk-1',
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'talk_accepted',
        to: 'speaker@example.com',
        subject: 'Your talk was accepted',
        sentAt: new Date(),
        status: 'sent'
      }

      expect(emailLogSchema.safeParse(log).success).toBe(true)
    })

    it('should accept log without talkId', () => {
      const log = {
        id: 'log-1',
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'cfp_closing_reminder',
        to: 'speaker@example.com',
        subject: 'CFP closing soon',
        sentAt: new Date(),
        status: 'sent'
      }

      expect(emailLogSchema.safeParse(log).success).toBe(true)
    })

    it('should accept log with error', () => {
      const log = {
        id: 'log-1',
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'talk_accepted',
        to: 'speaker@example.com',
        subject: 'Subject',
        sentAt: new Date(),
        status: 'failed',
        error: 'SMTP connection failed'
      }

      expect(emailLogSchema.safeParse(log).success).toBe(true)
    })

    it('should reject invalid email', () => {
      const log = {
        id: 'log-1',
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'talk_accepted',
        to: 'invalid-email',
        subject: 'Subject',
        sentAt: new Date(),
        status: 'sent'
      }

      expect(emailLogSchema.safeParse(log).success).toBe(false)
    })

    it('should reject invalid status', () => {
      const log = {
        id: 'log-1',
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'talk_accepted',
        to: 'speaker@example.com',
        subject: 'Subject',
        sentAt: new Date(),
        status: 'invalid'
      }

      expect(emailLogSchema.safeParse(log).success).toBe(false)
    })
  })

  describe('createEmailLogSchema', () => {
    it('should validate creation data without id and sentAt', () => {
      const data = {
        speakerId: 'speaker-1',
        editionId: 'edition-1',
        type: 'submission_confirmed',
        to: 'speaker@example.com',
        subject: 'Submission received',
        status: 'pending'
      }

      expect(createEmailLogSchema.safeParse(data).success).toBe(true)
    })
  })

  describe('getNotificationTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getNotificationTypeLabel('submission_confirmed')).toBe('Submission Confirmed')
      expect(getNotificationTypeLabel('talk_accepted')).toBe('Talk Accepted')
      expect(getNotificationTypeLabel('talk_rejected')).toBe('Talk Rejected')
      expect(getNotificationTypeLabel('confirmation_reminder')).toBe('Confirmation Reminder')
      expect(getNotificationTypeLabel('cfp_closing_reminder')).toBe('CFP Closing Reminder')
      expect(getNotificationTypeLabel('cospeaker_invitation')).toBe('Co-Speaker Invitation')
    })
  })

  describe('getNotificationSubject', () => {
    it('should generate submission confirmed subject', () => {
      const subject = getNotificationSubject('submission_confirmed', 'DevFest 2024')
      expect(subject).toBe('[DevFest 2024] Your talk submission has been received')
    })

    it('should generate talk accepted subject with title', () => {
      const subject = getNotificationSubject('talk_accepted', 'DevFest 2024', 'My Awesome Talk')
      expect(subject).toBe(
        '[DevFest 2024] Congratulations! Your talk "My Awesome Talk" has been accepted'
      )
    })

    it('should generate talk rejected subject with title', () => {
      const subject = getNotificationSubject('talk_rejected', 'DevFest 2024', 'My Talk')
      expect(subject).toBe('[DevFest 2024] Update on your talk submission "My Talk"')
    })

    it('should generate confirmation reminder subject with title', () => {
      const subject = getNotificationSubject('confirmation_reminder', 'DevFest 2024', 'My Talk')
      expect(subject).toBe('[DevFest 2024] Please confirm your participation for "My Talk"')
    })

    it('should generate cfp closing reminder subject', () => {
      const subject = getNotificationSubject('cfp_closing_reminder', 'DevFest 2024')
      expect(subject).toBe('[DevFest 2024] CFP closing soon - Submit your talk!')
    })

    it('should generate cospeaker invitation subject with title', () => {
      const subject = getNotificationSubject('cospeaker_invitation', 'DevFest 2024', 'My Talk')
      expect(subject).toBe('[DevFest 2024] You\'ve been invited as a co-speaker for "My Talk"')
    })
  })
})
