import { describe, expect, it } from 'vitest'
import {
  type CreateEventFeedback,
  type EventFeedback,
  type FeedbackStatus,
  type FeedbackType,
  type UpdateEventFeedback,
  createEventFeedbackSchema,
  eventFeedbackSchema,
  feedbackStatusSchema,
  feedbackTypeSchema,
  getFeedbackStatusColor,
  getFeedbackStatusLabel,
  getFeedbackTypeLabel,
  isFeedbackOpen,
  updateEventFeedbackSchema
} from './event-feedback'

describe('event-feedback', () => {
  describe('feedbackTypeSchema', () => {
    it('should accept valid feedback types', () => {
      expect(feedbackTypeSchema.parse('general')).toBe('general')
      expect(feedbackTypeSchema.parse('problem')).toBe('problem')
    })

    it('should reject invalid feedback types', () => {
      expect(() => feedbackTypeSchema.parse('invalid')).toThrow()
      expect(() => feedbackTypeSchema.parse('')).toThrow()
    })
  })

  describe('feedbackStatusSchema', () => {
    it('should accept valid feedback statuses', () => {
      expect(feedbackStatusSchema.parse('open')).toBe('open')
      expect(feedbackStatusSchema.parse('acknowledged')).toBe('acknowledged')
      expect(feedbackStatusSchema.parse('resolved')).toBe('resolved')
      expect(feedbackStatusSchema.parse('closed')).toBe('closed')
    })

    it('should reject invalid feedback statuses', () => {
      expect(() => feedbackStatusSchema.parse('invalid')).toThrow()
      expect(() => feedbackStatusSchema.parse('')).toThrow()
    })
  })

  describe('eventFeedbackSchema', () => {
    const validFeedback: EventFeedback = {
      id: 'feedback-123',
      editionId: 'edition-456',
      userId: 'user-789',
      feedbackType: 'general',
      subject: 'Great event!',
      message: 'I really enjoyed the conference.',
      status: 'open',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02')
    }

    it('should accept valid event feedback', () => {
      const result = eventFeedbackSchema.parse(validFeedback)
      expect(result).toEqual(validFeedback)
    })

    it('should accept feedback without subject', () => {
      const feedback = { ...validFeedback, subject: undefined }
      const result = eventFeedbackSchema.parse(feedback)
      expect(result.subject).toBeUndefined()
    })

    it('should default status to open', () => {
      const feedback = { ...validFeedback }
      ;(feedback as Record<string, unknown>).status = undefined
      const result = eventFeedbackSchema.parse(feedback)
      expect(result.status).toBe('open')
    })

    it('should reject message longer than 5000 characters', () => {
      const feedback = { ...validFeedback, message: 'a'.repeat(5001) }
      expect(() => eventFeedbackSchema.parse(feedback)).toThrow()
    })

    it('should reject empty message', () => {
      const feedback = { ...validFeedback, message: '' }
      expect(() => eventFeedbackSchema.parse(feedback)).toThrow()
    })

    it('should reject subject longer than 200 characters', () => {
      const feedback = { ...validFeedback, subject: 'a'.repeat(201) }
      expect(() => eventFeedbackSchema.parse(feedback)).toThrow()
    })
  })

  describe('createEventFeedbackSchema', () => {
    it('should accept valid create feedback data', () => {
      const data: CreateEventFeedback = {
        editionId: 'edition-456',
        userId: 'user-789',
        feedbackType: 'problem',
        message: 'There was an issue with registration.',
        status: 'open'
      }
      const result = createEventFeedbackSchema.parse(data)
      expect(result.editionId).toBe('edition-456')
      expect(result.feedbackType).toBe('problem')
    })

    it('should not require id, createdAt, updatedAt', () => {
      const data = {
        editionId: 'edition-456',
        userId: 'user-789',
        feedbackType: 'general',
        message: 'Nice event',
        status: 'open'
      }
      const result = createEventFeedbackSchema.parse(data)
      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('createdAt')
      expect(result).not.toHaveProperty('updatedAt')
    })
  })

  describe('updateEventFeedbackSchema', () => {
    it('should accept valid update feedback data', () => {
      const data: UpdateEventFeedback = {
        id: 'feedback-123',
        status: 'resolved'
      }
      const result = updateEventFeedbackSchema.parse(data)
      expect(result.id).toBe('feedback-123')
      expect(result.status).toBe('resolved')
    })

    it('should require id', () => {
      const data = { status: 'resolved' }
      expect(() => updateEventFeedbackSchema.parse(data)).toThrow()
    })

    it('should accept partial updates', () => {
      const data = { id: 'feedback-123', message: 'Updated message' }
      const result = updateEventFeedbackSchema.parse(data)
      expect(result.message).toBe('Updated message')
      expect(result).not.toHaveProperty('status')
    })
  })

  describe('getFeedbackTypeLabel', () => {
    it('should return correct labels for feedback types', () => {
      expect(getFeedbackTypeLabel('general')).toBe('General Feedback')
      expect(getFeedbackTypeLabel('problem')).toBe('Problem Report')
    })

    it('should handle all FeedbackType values', () => {
      const types: FeedbackType[] = ['general', 'problem']
      for (const type of types) {
        expect(typeof getFeedbackTypeLabel(type)).toBe('string')
        expect(getFeedbackTypeLabel(type).length).toBeGreaterThan(0)
      }
    })
  })

  describe('getFeedbackStatusLabel', () => {
    it('should return correct labels for feedback statuses', () => {
      expect(getFeedbackStatusLabel('open')).toBe('Open')
      expect(getFeedbackStatusLabel('acknowledged')).toBe('Acknowledged')
      expect(getFeedbackStatusLabel('resolved')).toBe('Resolved')
      expect(getFeedbackStatusLabel('closed')).toBe('Closed')
    })

    it('should handle all FeedbackStatus values', () => {
      const statuses: FeedbackStatus[] = ['open', 'acknowledged', 'resolved', 'closed']
      for (const status of statuses) {
        expect(typeof getFeedbackStatusLabel(status)).toBe('string')
        expect(getFeedbackStatusLabel(status).length).toBeGreaterThan(0)
      }
    })
  })

  describe('getFeedbackStatusColor', () => {
    it('should return correct colors for feedback statuses', () => {
      expect(getFeedbackStatusColor('open')).toBe('#f59e0b')
      expect(getFeedbackStatusColor('acknowledged')).toBe('#3b82f6')
      expect(getFeedbackStatusColor('resolved')).toBe('#22c55e')
      expect(getFeedbackStatusColor('closed')).toBe('#6b7280')
    })

    it('should return valid hex colors', () => {
      const statuses: FeedbackStatus[] = ['open', 'acknowledged', 'resolved', 'closed']
      for (const status of statuses) {
        const color = getFeedbackStatusColor(status)
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      }
    })
  })

  describe('isFeedbackOpen', () => {
    it('should return true for open status', () => {
      expect(isFeedbackOpen('open')).toBe(true)
    })

    it('should return true for acknowledged status', () => {
      expect(isFeedbackOpen('acknowledged')).toBe(true)
    })

    it('should return false for resolved status', () => {
      expect(isFeedbackOpen('resolved')).toBe(false)
    })

    it('should return false for closed status', () => {
      expect(isFeedbackOpen('closed')).toBe(false)
    })
  })
})
