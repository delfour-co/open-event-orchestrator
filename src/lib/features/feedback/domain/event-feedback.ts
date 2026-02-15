import { z } from 'zod'

/**
 * Event feedback type
 */
export const feedbackTypeSchema = z.enum(['general', 'problem'])

export type FeedbackType = z.infer<typeof feedbackTypeSchema>

/**
 * Event feedback status
 */
export const feedbackStatusSchema = z.enum(['open', 'acknowledged', 'resolved', 'closed'])

export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>

/**
 * Event feedback schema
 */
export const eventFeedbackSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  userId: z.string(),
  feedbackType: feedbackTypeSchema,
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  status: feedbackStatusSchema.default('open'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EventFeedback = z.infer<typeof eventFeedbackSchema>

export const createEventFeedbackSchema = eventFeedbackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateEventFeedback = z.infer<typeof createEventFeedbackSchema>

export const updateEventFeedbackSchema = createEventFeedbackSchema.partial().extend({
  id: z.string()
})

export type UpdateEventFeedback = z.infer<typeof updateEventFeedbackSchema>

/**
 * Get display label for feedback type
 */
export function getFeedbackTypeLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    general: 'General Feedback',
    problem: 'Problem Report'
  }
  return labels[type]
}

/**
 * Get display label for feedback status
 */
export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    open: 'Open',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    closed: 'Closed'
  }
  return labels[status]
}

/**
 * Get color for feedback status
 */
export function getFeedbackStatusColor(status: FeedbackStatus): string {
  const colors: Record<FeedbackStatus, string> = {
    open: '#f59e0b',
    acknowledged: '#3b82f6',
    resolved: '#22c55e',
    closed: '#6b7280'
  }
  return colors[status]
}

/**
 * Check if feedback is still open for updates
 */
export function isFeedbackOpen(status: FeedbackStatus): boolean {
  return status === 'open' || status === 'acknowledged'
}
