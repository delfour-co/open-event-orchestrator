import { z } from 'zod'
import { type RatingMode, ratingModeSchema } from './rating-mode'

/**
 * Feedback settings schema
 */
export const feedbackSettingsSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  sessionRatingEnabled: z.boolean().default(false),
  sessionRatingMode: ratingModeSchema.default('stars'),
  sessionCommentRequired: z.boolean().default(false),
  eventFeedbackEnabled: z.boolean().default(false),
  feedbackIntroText: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type FeedbackSettings = z.infer<typeof feedbackSettingsSchema>

export const createFeedbackSettingsSchema = feedbackSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateFeedbackSettings = z.infer<typeof createFeedbackSettingsSchema>

export const updateFeedbackSettingsSchema = createFeedbackSettingsSchema.partial().extend({
  id: z.string()
})

export type UpdateFeedbackSettings = z.infer<typeof updateFeedbackSettingsSchema>

/**
 * Default feedback settings
 */
export const DEFAULT_FEEDBACK_SETTINGS: Omit<CreateFeedbackSettings, 'editionId'> = {
  sessionRatingEnabled: false,
  sessionRatingMode: 'stars' as RatingMode,
  sessionCommentRequired: false,
  eventFeedbackEnabled: false,
  feedbackIntroText: 'We value your feedback! Help us improve future events.'
}

/**
 * Check if session feedback is enabled and configured
 */
export function canSubmitSessionFeedback(settings: FeedbackSettings | null): boolean {
  return settings?.sessionRatingEnabled ?? false
}

/**
 * Check if event feedback is enabled
 */
export function canSubmitEventFeedback(settings: FeedbackSettings | null): boolean {
  return settings?.eventFeedbackEnabled ?? false
}

/**
 * Get rating mode for session feedback
 */
export function getSessionRatingMode(settings: FeedbackSettings | null): RatingMode {
  return settings?.sessionRatingMode ?? 'stars'
}

/**
 * Check if comments are required for session feedback
 */
export function isCommentRequired(settings: FeedbackSettings | null): boolean {
  return settings?.sessionCommentRequired ?? false
}
