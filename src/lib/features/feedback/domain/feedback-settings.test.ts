import { describe, expect, it } from 'vitest'
import {
  type CreateFeedbackSettings,
  DEFAULT_FEEDBACK_SETTINGS,
  type FeedbackSettings,
  type UpdateFeedbackSettings,
  canSubmitEventFeedback,
  canSubmitSessionFeedback,
  createFeedbackSettingsSchema,
  feedbackSettingsSchema,
  getSessionRatingMode,
  isCommentRequired,
  updateFeedbackSettingsSchema
} from './feedback-settings'

describe('feedback-settings', () => {
  const validSettings: FeedbackSettings = {
    id: 'settings-123',
    editionId: 'edition-456',
    sessionRatingEnabled: true,
    sessionRatingMode: 'stars',
    sessionCommentRequired: false,
    eventFeedbackEnabled: true,
    feedbackIntroText: 'Please share your thoughts!',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-02')
  }

  describe('feedbackSettingsSchema', () => {
    it('should accept valid feedback settings', () => {
      const result = feedbackSettingsSchema.parse(validSettings)
      expect(result).toEqual(validSettings)
    })

    it('should default sessionRatingEnabled to false', () => {
      const settings = { ...validSettings }
      ;(settings as Record<string, unknown>).sessionRatingEnabled = undefined
      const result = feedbackSettingsSchema.parse(settings)
      expect(result.sessionRatingEnabled).toBe(false)
    })

    it('should default sessionRatingMode to stars', () => {
      const settings = { ...validSettings }
      ;(settings as Record<string, unknown>).sessionRatingMode = undefined
      const result = feedbackSettingsSchema.parse(settings)
      expect(result.sessionRatingMode).toBe('stars')
    })

    it('should default sessionCommentRequired to false', () => {
      const settings = { ...validSettings }
      ;(settings as Record<string, unknown>).sessionCommentRequired = undefined
      const result = feedbackSettingsSchema.parse(settings)
      expect(result.sessionCommentRequired).toBe(false)
    })

    it('should default eventFeedbackEnabled to false', () => {
      const settings = { ...validSettings }
      ;(settings as Record<string, unknown>).eventFeedbackEnabled = undefined
      const result = feedbackSettingsSchema.parse(settings)
      expect(result.eventFeedbackEnabled).toBe(false)
    })

    it('should accept optional feedbackIntroText', () => {
      const settings = { ...validSettings, feedbackIntroText: undefined }
      const result = feedbackSettingsSchema.parse(settings)
      expect(result.feedbackIntroText).toBeUndefined()
    })

    it('should reject feedbackIntroText longer than 2000 characters', () => {
      const settings = { ...validSettings, feedbackIntroText: 'a'.repeat(2001) }
      expect(() => feedbackSettingsSchema.parse(settings)).toThrow()
    })

    it('should accept all valid rating modes', () => {
      const modes = ['stars', 'scale_10', 'thumbs', 'yes_no']
      for (const mode of modes) {
        const settings = { ...validSettings, sessionRatingMode: mode }
        const result = feedbackSettingsSchema.parse(settings)
        expect(result.sessionRatingMode).toBe(mode)
      }
    })
  })

  describe('createFeedbackSettingsSchema', () => {
    it('should accept valid create settings data', () => {
      const data: CreateFeedbackSettings = {
        editionId: 'edition-456',
        sessionRatingEnabled: true,
        sessionRatingMode: 'thumbs',
        sessionCommentRequired: true,
        eventFeedbackEnabled: false
      }
      const result = createFeedbackSettingsSchema.parse(data)
      expect(result.editionId).toBe('edition-456')
      expect(result.sessionRatingMode).toBe('thumbs')
    })

    it('should not require id, createdAt, updatedAt', () => {
      const data = {
        editionId: 'edition-456'
      }
      const result = createFeedbackSettingsSchema.parse(data)
      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('createdAt')
      expect(result).not.toHaveProperty('updatedAt')
    })
  })

  describe('updateFeedbackSettingsSchema', () => {
    it('should accept valid update settings data', () => {
      const data: UpdateFeedbackSettings = {
        id: 'settings-123',
        sessionRatingEnabled: true
      }
      const result = updateFeedbackSettingsSchema.parse(data)
      expect(result.id).toBe('settings-123')
      expect(result.sessionRatingEnabled).toBe(true)
    })

    it('should require id', () => {
      const data = { sessionRatingEnabled: true }
      expect(() => updateFeedbackSettingsSchema.parse(data)).toThrow()
    })

    it('should accept partial updates', () => {
      const data = { id: 'settings-123', feedbackIntroText: 'New intro' }
      const result = updateFeedbackSettingsSchema.parse(data)
      expect(result.feedbackIntroText).toBe('New intro')
    })
  })

  describe('DEFAULT_FEEDBACK_SETTINGS', () => {
    it('should have sessionRatingEnabled as false', () => {
      expect(DEFAULT_FEEDBACK_SETTINGS.sessionRatingEnabled).toBe(false)
    })

    it('should have sessionRatingMode as stars', () => {
      expect(DEFAULT_FEEDBACK_SETTINGS.sessionRatingMode).toBe('stars')
    })

    it('should have sessionCommentRequired as false', () => {
      expect(DEFAULT_FEEDBACK_SETTINGS.sessionCommentRequired).toBe(false)
    })

    it('should have eventFeedbackEnabled as false', () => {
      expect(DEFAULT_FEEDBACK_SETTINGS.eventFeedbackEnabled).toBe(false)
    })

    it('should have a default feedbackIntroText', () => {
      expect(DEFAULT_FEEDBACK_SETTINGS.feedbackIntroText).toBeDefined()
      expect(typeof DEFAULT_FEEDBACK_SETTINGS.feedbackIntroText).toBe('string')
    })
  })

  describe('canSubmitSessionFeedback', () => {
    it('should return true when session rating is enabled', () => {
      const settings: FeedbackSettings = { ...validSettings, sessionRatingEnabled: true }
      expect(canSubmitSessionFeedback(settings)).toBe(true)
    })

    it('should return false when session rating is disabled', () => {
      const settings: FeedbackSettings = { ...validSettings, sessionRatingEnabled: false }
      expect(canSubmitSessionFeedback(settings)).toBe(false)
    })

    it('should return false when settings is null', () => {
      expect(canSubmitSessionFeedback(null)).toBe(false)
    })
  })

  describe('canSubmitEventFeedback', () => {
    it('should return true when event feedback is enabled', () => {
      const settings: FeedbackSettings = { ...validSettings, eventFeedbackEnabled: true }
      expect(canSubmitEventFeedback(settings)).toBe(true)
    })

    it('should return false when event feedback is disabled', () => {
      const settings: FeedbackSettings = { ...validSettings, eventFeedbackEnabled: false }
      expect(canSubmitEventFeedback(settings)).toBe(false)
    })

    it('should return false when settings is null', () => {
      expect(canSubmitEventFeedback(null)).toBe(false)
    })
  })

  describe('getSessionRatingMode', () => {
    it('should return the configured rating mode', () => {
      const settings: FeedbackSettings = { ...validSettings, sessionRatingMode: 'thumbs' }
      expect(getSessionRatingMode(settings)).toBe('thumbs')
    })

    it('should return stars as default when settings is null', () => {
      expect(getSessionRatingMode(null)).toBe('stars')
    })

    it('should return different rating modes', () => {
      const modes = ['stars', 'scale_10', 'thumbs', 'yes_no'] as const
      for (const mode of modes) {
        const settings: FeedbackSettings = { ...validSettings, sessionRatingMode: mode }
        expect(getSessionRatingMode(settings)).toBe(mode)
      }
    })
  })

  describe('isCommentRequired', () => {
    it('should return true when comments are required', () => {
      const settings: FeedbackSettings = { ...validSettings, sessionCommentRequired: true }
      expect(isCommentRequired(settings)).toBe(true)
    })

    it('should return false when comments are not required', () => {
      const settings: FeedbackSettings = { ...validSettings, sessionCommentRequired: false }
      expect(isCommentRequired(settings)).toBe(false)
    })

    it('should return false when settings is null', () => {
      expect(isCommentRequired(null)).toBe(false)
    })
  })
})
