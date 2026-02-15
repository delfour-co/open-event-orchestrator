import { z } from 'zod'
import { ratingModeSchema } from './rating-mode'

/**
 * Session feedback schema
 */
export const sessionFeedbackSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  editionId: z.string(),
  userId: z.string(),
  ratingMode: ratingModeSchema,
  numericValue: z.number().int().nullable(),
  comment: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SessionFeedback = z.infer<typeof sessionFeedbackSchema>

export const createSessionFeedbackSchema = sessionFeedbackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSessionFeedback = z.infer<typeof createSessionFeedbackSchema>

export const updateSessionFeedbackSchema = createSessionFeedbackSchema.partial().extend({
  id: z.string()
})

export type UpdateSessionFeedback = z.infer<typeof updateSessionFeedbackSchema>

/**
 * Session feedback summary for display
 */
export interface SessionFeedbackSummary {
  sessionId: string
  totalFeedback: number
  averageRating: number | null
  ratingDistribution: Record<number, number>
  hasComments: boolean
}

/**
 * Calculate summary statistics from session feedback
 */
export function calculateFeedbackSummary(
  feedback: SessionFeedback[]
): SessionFeedbackSummary | null {
  if (feedback.length === 0) return null

  const sessionId = feedback[0]?.sessionId
  if (!sessionId) return null

  const ratings = feedback.map((f) => f.numericValue).filter((v): v is number => v !== null)

  const distribution: Record<number, number> = {}
  for (const rating of ratings) {
    distribution[rating] = (distribution[rating] || 0) + 1
  }

  const sum = ratings.reduce((acc, val) => acc + val, 0)
  const averageRating = ratings.length > 0 ? sum / ratings.length : null

  const hasComments = feedback.some((f) => f.comment && f.comment.trim().length > 0)

  return {
    sessionId,
    totalFeedback: feedback.length,
    averageRating,
    ratingDistribution: distribution,
    hasComments
  }
}

/**
 * Check if user has already submitted feedback for a session
 */
export function hasUserSubmittedFeedback(feedback: SessionFeedback[], userId: string): boolean {
  return feedback.some((f) => f.userId === userId)
}

/**
 * Get user's feedback for a session
 */
export function getUserFeedback(
  feedback: SessionFeedback[],
  userId: string
): SessionFeedback | null {
  return feedback.find((f) => f.userId === userId) || null
}
