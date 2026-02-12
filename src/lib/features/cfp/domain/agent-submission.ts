/**
 * Agent Submission Domain
 *
 * Manages talk submissions made on behalf of speakers by organizers or agents.
 * Tracks submission origin, validation status, and notification history.
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

/**
 * Agent submission validation statuses
 */
export const AGENT_VALIDATION_STATUSES = [
  'pending', // Awaiting speaker validation
  'validated', // Speaker validated the submission
  'rejected', // Speaker rejected the submission
  'expired' // Validation request expired
] as const

/**
 * Submission origin types
 */
export const SUBMISSION_ORIGINS = [
  'speaker', // Direct submission by speaker
  'organizer', // Submitted by organizer on behalf
  'import', // Imported from another system
  'invitation' // From speaker invitation
] as const

/**
 * Default validation expiry in days
 */
export const DEFAULT_VALIDATION_EXPIRY_DAYS = 7

// ============================================================================
// Schemas
// ============================================================================

export const agentValidationStatusSchema = z.enum(AGENT_VALIDATION_STATUSES)
export type AgentValidationStatus = z.infer<typeof agentValidationStatusSchema>

export const submissionOriginSchema = z.enum(SUBMISSION_ORIGINS)
export type SubmissionOrigin = z.infer<typeof submissionOriginSchema>

/**
 * Agent submission record schema
 */
export const agentSubmissionSchema = z.object({
  id: z.string(),
  talkId: z.string(),
  speakerId: z.string(), // Primary speaker being represented
  submittedBy: z.string(), // User ID of the agent/organizer
  submittedByName: z.string().max(100), // Name for display
  submittedByEmail: z.string().email(),
  origin: submissionOriginSchema,
  validationStatus: agentValidationStatusSchema.default('pending'),
  validationToken: z.string().length(32).optional(),
  validationExpiresAt: z.date().optional(),
  validatedAt: z.date().optional(),
  validationNotes: z.string().max(500).optional(), // Notes from speaker
  notificationSentAt: z.date().optional(),
  reminderSentAt: z.date().optional(),
  originalContent: z.record(z.unknown()).optional(), // Snapshot of original submission
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AgentSubmission = z.infer<typeof agentSubmissionSchema>

/**
 * Create agent submission schema
 */
export const createAgentSubmissionSchema = agentSubmissionSchema.omit({
  id: true,
  validationStatus: true,
  validatedAt: true,
  notificationSentAt: true,
  reminderSentAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateAgentSubmission = z.infer<typeof createAgentSubmissionSchema>

/**
 * Update agent submission schema
 */
export const updateAgentSubmissionSchema = z.object({
  validationStatus: agentValidationStatusSchema.optional(),
  validatedAt: z.date().optional(),
  validationNotes: z.string().max(500).optional(),
  notificationSentAt: z.date().optional(),
  reminderSentAt: z.date().optional()
})

export type UpdateAgentSubmission = z.infer<typeof updateAgentSubmissionSchema>

/**
 * Speaker validation input
 */
export const speakerValidationInputSchema = z.object({
  token: z.string().length(32),
  action: z.enum(['validate', 'reject']),
  notes: z.string().max(500).optional()
})

export type SpeakerValidationInput = z.infer<typeof speakerValidationInputSchema>

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate agent submission
 */
export function validateAgentSubmission(data: unknown): AgentSubmission {
  return agentSubmissionSchema.parse(data)
}

/**
 * Validate create agent submission input
 */
export function validateCreateAgentSubmission(data: unknown): CreateAgentSubmission {
  return createAgentSubmissionSchema.parse(data)
}

/**
 * Validate speaker validation input
 */
export function validateSpeakerValidationInput(data: unknown): SpeakerValidationInput {
  return speakerValidationInputSchema.parse(data)
}

// ============================================================================
// Status Check Functions
// ============================================================================

/**
 * Check if submission is pending validation
 */
export function isPendingValidation(submission: AgentSubmission): boolean {
  return submission.validationStatus === 'pending'
}

/**
 * Check if submission is validated
 */
export function isValidated(submission: AgentSubmission): boolean {
  return submission.validationStatus === 'validated'
}

/**
 * Check if submission was rejected by speaker
 */
export function isRejectedByPeaker(submission: AgentSubmission): boolean {
  return submission.validationStatus === 'rejected'
}

/**
 * Check if validation has expired
 */
export function isValidationExpired(submission: AgentSubmission): boolean {
  if (submission.validationStatus !== 'pending') return false
  if (!submission.validationExpiresAt) return false
  return new Date() > submission.validationExpiresAt
}

/**
 * Check if validation is still active (pending and not expired)
 */
export function isValidationActive(submission: AgentSubmission): boolean {
  return isPendingValidation(submission) && !isValidationExpired(submission)
}

/**
 * Check if submission is from agent (not direct speaker)
 */
export function isAgentSubmission(submission: AgentSubmission): boolean {
  return submission.origin !== 'speaker'
}

/**
 * Check if submission needs notification
 */
export function needsNotification(submission: AgentSubmission): boolean {
  return isPendingValidation(submission) && !submission.notificationSentAt
}

/**
 * Check if submission needs reminder
 */
export function needsReminder(submission: AgentSubmission, reminderThresholdDays = 3): boolean {
  if (!isPendingValidation(submission)) return false
  if (!submission.notificationSentAt) return false
  if (submission.reminderSentAt) return false

  const daysSinceNotification =
    (Date.now() - submission.notificationSentAt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceNotification >= reminderThresholdDays
}

// ============================================================================
// Token Functions
// ============================================================================

/**
 * Generate validation token
 */
export function generateValidationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Calculate validation expiry date
 */
export function calculateValidationExpiry(days: number = DEFAULT_VALIDATION_EXPIRY_DAYS): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + days)
  return expiry
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[a-z0-9]{32}$/.test(token)
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get validation status label
 */
export function getValidationStatusLabel(status: AgentValidationStatus): string {
  const labels: Record<AgentValidationStatus, string> = {
    pending: 'Pending Validation',
    validated: 'Validated',
    rejected: 'Rejected',
    expired: 'Expired'
  }
  return labels[status]
}

/**
 * Get validation status color
 */
export function getValidationStatusColor(status: AgentValidationStatus): string {
  const colors: Record<AgentValidationStatus, string> = {
    pending: 'yellow',
    validated: 'green',
    rejected: 'red',
    expired: 'gray'
  }
  return colors[status]
}

/**
 * Get submission origin label
 */
export function getOriginLabel(origin: SubmissionOrigin): string {
  const labels: Record<SubmissionOrigin, string> = {
    speaker: 'Direct Submission',
    organizer: 'Submitted by Organizer',
    import: 'Imported',
    invitation: 'From Invitation'
  }
  return labels[origin]
}

/**
 * Get submission origin icon
 */
export function getOriginIcon(origin: SubmissionOrigin): string {
  const icons: Record<SubmissionOrigin, string> = {
    speaker: 'user',
    organizer: 'user-cog',
    import: 'file-import',
    invitation: 'mail'
  }
  return icons[origin]
}

/**
 * Format submission attribution
 */
export function formatAttribution(submission: AgentSubmission): string {
  switch (submission.origin) {
    case 'speaker':
      return 'Submitted directly'
    case 'organizer':
      return `Submitted by ${submission.submittedByName}`
    case 'import':
      return `Imported by ${submission.submittedByName}`
    case 'invitation':
      return 'From speaker invitation'
  }
}

// ============================================================================
// Time Functions
// ============================================================================

/**
 * Get remaining validation time
 */
export function getRemainingValidationTime(submission: AgentSubmission): {
  hasTime: boolean
  days: number
  hours: number
  formatted: string
} {
  if (!submission.validationExpiresAt || submission.validationStatus !== 'pending') {
    return { hasTime: false, days: 0, hours: 0, formatted: 'N/A' }
  }

  const now = new Date()
  const diff = submission.validationExpiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return { hasTime: false, days: 0, hours: 0, formatted: 'Expired' }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  let formatted: string
  if (days > 0) {
    formatted = `${days}d ${hours}h`
  } else {
    formatted = `${hours}h`
  }

  return { hasTime: true, days, hours, formatted }
}

/**
 * Format validation expiry date
 */
export function formatValidationExpiry(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Get notification email subject
 */
export function getAgentSubmissionEmailSubject(
  type: 'initial' | 'reminder' | 'validated' | 'rejected',
  talkTitle: string
): string {
  switch (type) {
    case 'initial':
      return `Review required: "${talkTitle}" submitted on your behalf`
    case 'reminder':
      return `Reminder: Please review "${talkTitle}"`
    case 'validated':
      return `Submission validated: "${talkTitle}"`
    case 'rejected':
      return `Submission rejected: "${talkTitle}"`
  }
}

/**
 * Build notification context for email template
 */
export function buildAgentNotificationContext(
  submission: AgentSubmission,
  talkTitle: string,
  eventName: string,
  speakerName: string,
  validationUrl: string
): Record<string, string> {
  const remaining = getRemainingValidationTime(submission)

  return {
    speakerName,
    talkTitle,
    eventName,
    submittedByName: submission.submittedByName,
    submittedByEmail: submission.submittedByEmail,
    origin: getOriginLabel(submission.origin),
    validationUrl,
    validationDeadline: submission.validationExpiresAt
      ? formatValidationExpiry(submission.validationExpiresAt)
      : '',
    remainingTime: remaining.formatted,
    validationNotes: submission.validationNotes || ''
  }
}

// ============================================================================
// Validation Action Functions
// ============================================================================

/**
 * Process speaker validation action
 */
export function processSpeakerValidation(
  submission: AgentSubmission,
  input: SpeakerValidationInput
): { success: boolean; error?: string; newStatus?: AgentValidationStatus } {
  // Check token
  if (submission.validationToken !== input.token) {
    return { success: false, error: 'Invalid validation token' }
  }

  // Check if pending
  if (!isPendingValidation(submission)) {
    return { success: false, error: 'Submission is not pending validation' }
  }

  // Check if expired
  if (isValidationExpired(submission)) {
    return { success: false, error: 'Validation link has expired' }
  }

  const newStatus: AgentValidationStatus = input.action === 'validate' ? 'validated' : 'rejected'

  return { success: true, newStatus }
}

/**
 * Mark validation as expired
 */
export function markAsExpired(submission: AgentSubmission): UpdateAgentSubmission {
  if (!isPendingValidation(submission)) {
    throw new Error('Can only expire pending submissions')
  }

  return {
    validationStatus: 'expired'
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Filter submissions by validation status
 */
export function filterByValidationStatus(
  submissions: AgentSubmission[],
  status: AgentValidationStatus
): AgentSubmission[] {
  return submissions.filter((s) => s.validationStatus === status)
}

/**
 * Filter submissions by origin
 */
export function filterByOrigin(
  submissions: AgentSubmission[],
  origin: SubmissionOrigin
): AgentSubmission[] {
  return submissions.filter((s) => s.origin === origin)
}

/**
 * Get submissions needing action (pending notifications or reminders)
 */
export function getSubmissionsNeedingAction(submissions: AgentSubmission[]): {
  needNotification: AgentSubmission[]
  needReminder: AgentSubmission[]
  expired: AgentSubmission[]
} {
  const needNotification = submissions.filter(needsNotification)
  const needReminder = submissions.filter((s) => needsReminder(s))
  const expired = submissions.filter(isValidationExpired)

  return { needNotification, needReminder, expired }
}

/**
 * Sort submissions by date (most recent first)
 */
export function sortByDate(submissions: AgentSubmission[]): AgentSubmission[] {
  return [...submissions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Agent submission statistics
 */
export interface AgentSubmissionStats {
  total: number
  byStatus: Record<AgentValidationStatus, number>
  byOrigin: Record<SubmissionOrigin, number>
  validationRate: number
  averageValidationTimeHours: number
}

/**
 * Calculate agent submission statistics
 */
export function calculateAgentSubmissionStats(
  submissions: AgentSubmission[]
): AgentSubmissionStats {
  const byStatus: Record<AgentValidationStatus, number> = {
    pending: 0,
    validated: 0,
    rejected: 0,
    expired: 0
  }

  const byOrigin: Record<SubmissionOrigin, number> = {
    speaker: 0,
    organizer: 0,
    import: 0,
    invitation: 0
  }

  for (const s of submissions) {
    byStatus[s.validationStatus]++
    byOrigin[s.origin]++
  }

  const validated = submissions.filter(isValidated)
  const totalDecided = validated.length + submissions.filter(isRejectedByPeaker).length
  const validationRate = totalDecided > 0 ? (validated.length / totalDecided) * 100 : 0

  // Calculate average validation time
  const validatedWithTime = validated.filter((s) => s.validatedAt)
  const averageValidationTimeHours =
    validatedWithTime.length > 0
      ? validatedWithTime.reduce((sum, s) => {
          const validatedTime = s.validatedAt?.getTime() ?? 0
          const created = s.createdAt.getTime()
          return sum + (validatedTime - created) / (1000 * 60 * 60)
        }, 0) / validatedWithTime.length
      : 0

  return {
    total: submissions.length,
    byStatus,
    byOrigin,
    validationRate: Math.round(validationRate * 10) / 10,
    averageValidationTimeHours: Math.round(averageValidationTimeHours * 10) / 10
  }
}
