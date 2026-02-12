/**
 * Speaker Feedback Domain
 *
 * Handles personalized feedback for speakers with acceptance/rejection decisions.
 * Supports templates, dynamic variables, and anonymized reviewer comments.
 */

import { z } from 'zod'
import type { TalkStatus } from './talk'

/**
 * Feedback template types
 */
export const feedbackTemplateTypeSchema = z.enum(['accepted', 'rejected', 'waitlisted', 'custom'])

export type FeedbackTemplateType = z.infer<typeof feedbackTemplateTypeSchema>

/**
 * Dynamic variables available in feedback templates
 */
export const FEEDBACK_TEMPLATE_VARIABLES = {
  speaker_name: 'Speaker first name',
  speaker_full_name: 'Speaker full name',
  talk_title: 'Talk title',
  talk_abstract: 'Talk abstract',
  event_name: 'Event name',
  edition_name: 'Edition name',
  edition_dates: 'Edition dates',
  edition_location: 'Edition location',
  category_name: 'Talk category',
  format_name: 'Talk format',
  average_rating: 'Average review rating',
  reviewer_comments: 'Anonymized reviewer comments',
  confirmation_url: 'Confirmation URL',
  cfp_url: 'CFP portal URL'
} as const

export type FeedbackTemplateVariable = keyof typeof FEEDBACK_TEMPLATE_VARIABLES

/**
 * Feedback template schema
 */
export const feedbackTemplateSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  type: feedbackTemplateTypeSchema,
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  includeReviewerComments: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type FeedbackTemplate = z.infer<typeof feedbackTemplateSchema>

export const createFeedbackTemplateSchema = feedbackTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateFeedbackTemplate = z.infer<typeof createFeedbackTemplateSchema>

export const updateFeedbackTemplateSchema = createFeedbackTemplateSchema.partial().extend({
  id: z.string()
})

export type UpdateFeedbackTemplate = z.infer<typeof updateFeedbackTemplateSchema>

/**
 * Speaker feedback record schema (personalized feedback per talk)
 */
export const speakerFeedbackSchema = z.object({
  id: z.string(),
  talkId: z.string(),
  speakerId: z.string(),
  templateId: z.string().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  sentAt: z.date().optional(),
  status: z.enum(['draft', 'sent', 'failed']).default('draft'),
  error: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SpeakerFeedback = z.infer<typeof speakerFeedbackSchema>

export const createSpeakerFeedbackSchema = speakerFeedbackSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSpeakerFeedback = z.infer<typeof createSpeakerFeedbackSchema>

export const updateSpeakerFeedbackSchema = createSpeakerFeedbackSchema.partial().extend({
  id: z.string()
})

export type UpdateSpeakerFeedback = z.infer<typeof updateSpeakerFeedbackSchema>

/**
 * Template variable context for rendering
 */
export interface FeedbackVariableContext {
  speakerFirstName: string
  speakerLastName: string
  talkTitle: string
  talkAbstract?: string
  eventName: string
  editionName: string
  editionDates?: string
  editionLocation?: string
  categoryName?: string
  formatName?: string
  averageRating?: number
  reviewerComments?: string[]
  confirmationUrl?: string
  cfpUrl?: string
}

// ============================================================================
// Template Variable Functions
// ============================================================================

/**
 * Get all available template variables
 */
export function getAvailableVariables(): Array<{
  variable: FeedbackTemplateVariable
  description: string
  example: string
}> {
  return [
    { variable: 'speaker_name', description: 'Speaker first name', example: 'John' },
    { variable: 'speaker_full_name', description: 'Speaker full name', example: 'John Doe' },
    { variable: 'talk_title', description: 'Talk title', example: 'Building Scalable APIs' },
    { variable: 'talk_abstract', description: 'Talk abstract', example: 'In this talk...' },
    { variable: 'event_name', description: 'Event name', example: 'DevConf' },
    { variable: 'edition_name', description: 'Edition name', example: 'DevConf 2025' },
    { variable: 'edition_dates', description: 'Edition dates', example: 'June 15-17, 2025' },
    { variable: 'edition_location', description: 'Edition location', example: 'Paris, France' },
    { variable: 'category_name', description: 'Talk category', example: 'Backend' },
    { variable: 'format_name', description: 'Talk format', example: 'Conference (45 min)' },
    { variable: 'average_rating', description: 'Average review rating', example: '4.2/5' },
    {
      variable: 'reviewer_comments',
      description: 'Anonymized reviewer comments',
      example: '- Great topic\n- Clear structure'
    },
    {
      variable: 'confirmation_url',
      description: 'Confirmation URL',
      example: 'https://...'
    },
    { variable: 'cfp_url', description: 'CFP portal URL', example: 'https://...' }
  ]
}

/**
 * Replace template variables with actual values
 */
export function renderTemplate(template: string, context: FeedbackVariableContext): string {
  let result = template

  // Simple replacements
  result = result.replace(/\{speaker_name\}/g, context.speakerFirstName)
  result = result.replace(
    /\{speaker_full_name\}/g,
    `${context.speakerFirstName} ${context.speakerLastName}`
  )
  result = result.replace(/\{talk_title\}/g, context.talkTitle)
  result = result.replace(/\{talk_abstract\}/g, context.talkAbstract || '')
  result = result.replace(/\{event_name\}/g, context.eventName)
  result = result.replace(/\{edition_name\}/g, context.editionName)
  result = result.replace(/\{edition_dates\}/g, context.editionDates || '')
  result = result.replace(/\{edition_location\}/g, context.editionLocation || '')
  result = result.replace(/\{category_name\}/g, context.categoryName || '')
  result = result.replace(/\{format_name\}/g, context.formatName || '')

  // Average rating
  if (context.averageRating !== undefined) {
    result = result.replace(/\{average_rating\}/g, `${context.averageRating.toFixed(1)}/5`)
  } else {
    result = result.replace(/\{average_rating\}/g, 'N/A')
  }

  // Reviewer comments
  if (context.reviewerComments && context.reviewerComments.length > 0) {
    const formattedComments = context.reviewerComments.map((c) => `- ${c}`).join('\n')
    result = result.replace(/\{reviewer_comments\}/g, formattedComments)
  } else {
    result = result.replace(/\{reviewer_comments\}/g, '')
  }

  // URLs
  result = result.replace(/\{confirmation_url\}/g, context.confirmationUrl || '')
  result = result.replace(/\{cfp_url\}/g, context.cfpUrl || '')

  return result
}

/**
 * Validate template for required variables
 */
export function validateTemplate(template: string): {
  valid: boolean
  missingVariables: string[]
  unknownVariables: string[]
} {
  const variablePattern = /\{([a-z_]+)\}/g
  const matches = Array.from(template.matchAll(variablePattern))
  const foundVariables = matches.map((m) => m[1])

  const knownVariables = Object.keys(FEEDBACK_TEMPLATE_VARIABLES)
  const unknownVariables = foundVariables.filter((v) => !knownVariables.includes(v))

  return {
    valid: unknownVariables.length === 0,
    missingVariables: [],
    unknownVariables
  }
}

/**
 * Extract variables used in a template
 */
export function extractVariables(template: string): FeedbackTemplateVariable[] {
  const variablePattern = /\{([a-z_]+)\}/g
  const matches = Array.from(template.matchAll(variablePattern))
  const variables: FeedbackTemplateVariable[] = []

  for (const match of matches) {
    const variable = match[1] as FeedbackTemplateVariable
    if (variable in FEEDBACK_TEMPLATE_VARIABLES && !variables.includes(variable)) {
      variables.push(variable)
    }
  }

  return variables
}

// ============================================================================
// Default Templates
// ============================================================================

/**
 * Default acceptance template
 */
export const DEFAULT_ACCEPTED_TEMPLATE = {
  name: 'Default Acceptance',
  subject: 'Your talk "{talk_title}" has been accepted at {edition_name}!',
  body: `Dear {speaker_name},

We are thrilled to inform you that your talk "{talk_title}" has been accepted for {edition_name}!

Your proposal stood out among many excellent submissions, and we believe it will bring great value to our attendees.

{reviewer_comments}

**Next Steps:**
Please confirm your participation by clicking the link below:
{confirmation_url}

**Event Details:**
- Event: {event_name}
- Dates: {edition_dates}
- Location: {edition_location}

If you have any questions, please don't hesitate to reach out.

We look forward to seeing you at {edition_name}!

Best regards,
The {event_name} Team`,
  includeReviewerComments: true
}

/**
 * Default rejection template
 */
export const DEFAULT_REJECTED_TEMPLATE = {
  name: 'Default Rejection',
  subject: 'Update on your submission to {edition_name}',
  body: `Dear {speaker_name},

Thank you for submitting your talk "{talk_title}" to {edition_name}.

After careful consideration by our program committee, we regret to inform you that we were unable to include your talk in this year's program.

We received an exceptional number of high-quality submissions, making the selection process extremely competitive. This decision does not reflect on the quality of your proposal.

{reviewer_comments}

We encourage you to submit again for future editions of {event_name}. Your expertise and willingness to share knowledge are valuable to our community.

Thank you for your understanding, and we hope to see you at {edition_name} as an attendee.

Best regards,
The {event_name} Team`,
  includeReviewerComments: false
}

/**
 * Default waitlist template
 */
export const DEFAULT_WAITLISTED_TEMPLATE = {
  name: 'Default Waitlist',
  subject: 'Your submission to {edition_name} - Waitlisted',
  body: `Dear {speaker_name},

Thank you for submitting your talk "{talk_title}" to {edition_name}.

We received many excellent proposals this year, and while we were impressed by your submission, we have placed it on our waitlist.

**What this means:**
Your talk has not been rejected. If a scheduled speaker is unable to present, we may reach out to you to fill their slot. We will contact you as soon as possible if this opportunity arises.

{reviewer_comments}

In the meantime, we recommend you keep your calendar flexible for the event dates:
- Dates: {edition_dates}
- Location: {edition_location}

Thank you for your patience and understanding.

Best regards,
The {event_name} Team`,
  includeReviewerComments: false
}

/**
 * Get default template for a status
 */
export function getDefaultTemplate(
  type: FeedbackTemplateType
): Omit<CreateFeedbackTemplate, 'editionId' | 'type' | 'isDefault'> | null {
  switch (type) {
    case 'accepted':
      return DEFAULT_ACCEPTED_TEMPLATE
    case 'rejected':
      return DEFAULT_REJECTED_TEMPLATE
    case 'waitlisted':
      return DEFAULT_WAITLISTED_TEMPLATE
    case 'custom':
      return null
  }
}

// ============================================================================
// Feedback Helpers
// ============================================================================

/**
 * Get appropriate template type for a talk status
 */
export function getTemplateTypeForStatus(status: TalkStatus): FeedbackTemplateType | null {
  switch (status) {
    case 'accepted':
    case 'confirmed':
      return 'accepted'
    case 'rejected':
      return 'rejected'
    default:
      return null
  }
}

/**
 * Anonymize reviewer comments (remove names, usernames, etc.)
 */
export function anonymizeComments(comments: Array<{ content: string }>): string[] {
  return comments
    .map((c) => c.content)
    .filter((c) => c && c.trim().length > 0)
    .map((c) => {
      // Remove common patterns that might identify reviewers
      let anonymized = c
      // Remove email addresses
      anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      // Remove @mentions
      anonymized = anonymized.replace(/@\w+/g, '[user]')
      // Remove "I think", "My opinion" etc to make it more objective
      anonymized = anonymized.replace(/\b(I|my|me)\b/gi, 'the reviewer')
      return anonymized.trim()
    })
    .filter((c) => c.length > 0)
}

/**
 * Format reviewer comments for inclusion in feedback
 */
export function formatReviewerComments(comments: string[], includeHeader = true): string {
  if (comments.length === 0) {
    return ''
  }

  const formatted = comments.map((c) => `• ${c}`).join('\n')

  if (includeHeader) {
    return `**Feedback from our reviewers:**\n${formatted}`
  }

  return formatted
}

/**
 * Check if feedback can be sent for a talk status
 */
export function canSendFeedback(status: TalkStatus): boolean {
  return ['accepted', 'rejected', 'confirmed'].includes(status)
}

/**
 * Check if feedback has been sent
 */
export function isFeedbackSent(feedback: SpeakerFeedback): boolean {
  return feedback.status === 'sent' && feedback.sentAt !== undefined
}

/**
 * Get feedback status label
 */
export function getFeedbackStatusLabel(status: SpeakerFeedback['status']): string {
  const labels: Record<SpeakerFeedback['status'], string> = {
    draft: 'Draft',
    sent: 'Sent',
    failed: 'Failed'
  }
  return labels[status]
}

/**
 * Get feedback status color (for UI)
 */
export function getFeedbackStatusColor(status: SpeakerFeedback['status']): string {
  const colors: Record<SpeakerFeedback['status'], string> = {
    draft: '#94a3b8', // slate-400
    sent: '#22c55e', // green-500
    failed: '#ef4444' // red-500
  }
  return colors[status]
}
