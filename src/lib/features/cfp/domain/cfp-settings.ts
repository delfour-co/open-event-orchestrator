/**
 * CFP Settings Domain
 *
 * Handles Call for Papers configuration per edition including:
 * - Submission dates and limits
 * - Review mode (anonymous or not)
 * - Speaker reveal timing
 */

import { z } from 'zod'
import type { TalkStatus } from './talk'

/**
 * CFP settings schema
 */
export const cfpSettingsSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  cfpOpenDate: z.date().optional(),
  cfpCloseDate: z.date().optional(),
  introText: z.string().max(5000).optional(),
  maxSubmissionsPerSpeaker: z.number().int().min(1).max(50).default(3),
  requireAbstract: z.boolean().default(true),
  requireDescription: z.boolean().default(false),
  allowCoSpeakers: z.boolean().default(true),
  anonymousReview: z.boolean().default(false),
  revealSpeakersAfterDecision: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CfpSettings = z.infer<typeof cfpSettingsSchema>

export const createCfpSettingsSchema = cfpSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateCfpSettings = z.infer<typeof createCfpSettingsSchema>

export const updateCfpSettingsSchema = createCfpSettingsSchema.partial().extend({
  id: z.string()
})

export type UpdateCfpSettings = z.infer<typeof updateCfpSettingsSchema>

/**
 * Default CFP settings
 */
export const DEFAULT_CFP_SETTINGS: Omit<CreateCfpSettings, 'editionId'> = {
  introText:
    'We are looking for speakers to share their knowledge and experience at our conference.',
  maxSubmissionsPerSpeaker: 3,
  requireAbstract: true,
  requireDescription: false,
  allowCoSpeakers: true,
  anonymousReview: false,
  revealSpeakersAfterDecision: true
}

/**
 * User roles for CFP access
 */
export type CfpUserRole = 'owner' | 'admin' | 'reviewer' | 'member' | null

/**
 * Final talk statuses where speaker identity can be revealed
 */
export const FINAL_TALK_STATUSES: TalkStatus[] = [
  'accepted',
  'rejected',
  'confirmed',
  'declined',
  'withdrawn'
]

/**
 * Check if a talk status is final (decision has been made)
 */
export function isFinalStatus(status: TalkStatus): boolean {
  return FINAL_TALK_STATUSES.includes(status)
}

/**
 * Determine if speaker info should be visible based on settings, role, and talk status
 *
 * @param settings - CFP settings (anonymousReview, revealSpeakersAfterDecision)
 * @param userRole - User's role in the organization
 * @param talkStatus - Current talk status (optional, for per-talk checks)
 * @returns boolean indicating if speaker info should be shown
 */
export function canViewSpeakerInfo(
  settings: Pick<CfpSettings, 'anonymousReview' | 'revealSpeakersAfterDecision'> | null,
  userRole: CfpUserRole,
  talkStatus?: TalkStatus
): boolean {
  // If no settings or anonymous review is disabled, show speaker info
  if (!settings || !settings.anonymousReview) {
    return true
  }

  // Owners and admins can always see speaker info
  if (userRole === 'owner' || userRole === 'admin') {
    return true
  }

  // If reveal after decision is enabled and talk has a final status, show speaker info
  if (settings.revealSpeakersAfterDecision && talkStatus && isFinalStatus(talkStatus)) {
    return true
  }

  // Otherwise, hide speaker info
  return false
}

/**
 * Get message explaining why speaker info is hidden
 */
export function getAnonymousReviewMessage(
  settings: Pick<CfpSettings, 'anonymousReview' | 'revealSpeakersAfterDecision'> | null,
  userRole: CfpUserRole,
  talkStatus?: TalkStatus
): string | null {
  if (canViewSpeakerInfo(settings, userRole, talkStatus)) {
    return null
  }

  if (settings?.revealSpeakersAfterDecision) {
    return 'Speaker information is hidden during anonymous review. It will be revealed after a decision is made.'
  }

  return 'Speaker information is hidden during anonymous review. Only admins and owners can see speaker details.'
}

/**
 * Check if CFP is currently open
 */
export function isCfpOpen(
  settings: Pick<CfpSettings, 'cfpOpenDate' | 'cfpCloseDate'> | null
): boolean {
  if (!settings) {
    return false
  }

  const now = new Date()
  const { cfpOpenDate, cfpCloseDate } = settings

  if (cfpOpenDate && now < cfpOpenDate) {
    return false
  }

  if (cfpCloseDate && now > cfpCloseDate) {
    return false
  }

  return true
}

/**
 * Get CFP status label
 */
export function getCfpStatus(
  settings: Pick<CfpSettings, 'cfpOpenDate' | 'cfpCloseDate'> | null
): 'not_configured' | 'not_yet_open' | 'open' | 'closed' {
  if (!settings) {
    return 'not_configured'
  }

  const now = new Date()
  const { cfpOpenDate, cfpCloseDate } = settings

  if (cfpOpenDate && now < cfpOpenDate) {
    return 'not_yet_open'
  }

  if (cfpCloseDate && now > cfpCloseDate) {
    return 'closed'
  }

  if (cfpOpenDate || cfpCloseDate) {
    return 'open'
  }

  return 'not_configured'
}

/**
 * Get CFP status display info
 */
export function getCfpStatusDisplay(
  settings: Pick<CfpSettings, 'cfpOpenDate' | 'cfpCloseDate'> | null
): { label: string; color: string; description?: string } {
  const status = getCfpStatus(settings)

  switch (status) {
    case 'not_configured':
      return {
        label: 'Not Configured',
        color: '#94a3b8',
        description: 'CFP dates have not been set'
      }
    case 'not_yet_open':
      return {
        label: 'Coming Soon',
        color: '#f59e0b',
        description: `Opens on ${settings?.cfpOpenDate?.toLocaleDateString()}`
      }
    case 'open':
      return {
        label: 'Open',
        color: '#22c55e',
        description: settings?.cfpCloseDate
          ? `Closes on ${settings.cfpCloseDate.toLocaleDateString()}`
          : 'Accepting submissions'
      }
    case 'closed':
      return {
        label: 'Closed',
        color: '#ef4444',
        description: `Closed on ${settings?.cfpCloseDate?.toLocaleDateString()}`
      }
  }
}

/**
 * Validate CFP settings dates
 */
export function validateCfpDates(
  openDate: Date | undefined,
  closeDate: Date | undefined
): { valid: boolean; error?: string } {
  if (openDate && closeDate && closeDate <= openDate) {
    return {
      valid: false,
      error: 'Close date must be after open date'
    }
  }

  return { valid: true }
}

/**
 * Check if a speaker has reached submission limit
 */
export function hasReachedSubmissionLimit(
  currentSubmissions: number,
  maxSubmissions: number
): boolean {
  return currentSubmissions >= maxSubmissions
}

/**
 * Get remaining submissions for a speaker
 */
export function getRemainingSubmissions(
  currentSubmissions: number,
  maxSubmissions: number
): number {
  return Math.max(0, maxSubmissions - currentSubmissions)
}
