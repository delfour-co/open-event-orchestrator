/**
 * Lead Scoring Domain Entity
 *
 * Configurable scoring system to prioritize contacts based on engagement.
 */

import { z } from 'zod'

export const scoringActionSchema = z.enum([
  'email_opened',
  'email_clicked',
  'ticket_purchased',
  'ticket_checked_in',
  'talk_submitted',
  'talk_accepted',
  'segment_joined',
  'inactivity',
  'custom',
  'manual_adjustment'
])
export type ScoringAction = z.infer<typeof scoringActionSchema>

export const leadScoreLevelSchema = z.enum(['cold', 'warm', 'hot'])
export type LeadScoreLevel = z.infer<typeof leadScoreLevelSchema>

export const leadScoringRuleSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string().min(1).max(100),
  action: scoringActionSchema,
  points: z.number().int().min(-1000).max(1000),
  inactivityDays: z.number().int().min(1).max(365).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type LeadScoringRule = z.infer<typeof leadScoringRuleSchema>

export interface CreateLeadScoringRule {
  eventId: string
  name: string
  action: ScoringAction
  points: number
  inactivityDays?: number
}

export interface UpdateLeadScoringRule {
  name?: string
  points?: number
  inactivityDays?: number
  isActive?: boolean
}

export const leadScoreHistorySchema = z.object({
  id: z.string(),
  contactId: z.string(),
  ruleId: z.string().optional(),
  action: scoringActionSchema,
  pointsChange: z.number(),
  previousScore: z.number(),
  newScore: z.number(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date()
})

export type LeadScoreHistory = z.infer<typeof leadScoreHistorySchema>

// Scoring action labels for UI
export const SCORING_ACTION_LABELS: Record<ScoringAction, string> = {
  email_opened: 'Email Opened',
  email_clicked: 'Link Clicked',
  ticket_purchased: 'Ticket Purchased',
  ticket_checked_in: 'Checked In',
  talk_submitted: 'Talk Submitted',
  talk_accepted: 'Talk Accepted',
  segment_joined: 'Joined Segment',
  inactivity: 'Inactivity Penalty',
  custom: 'Custom Action',
  manual_adjustment: 'Manual Adjustment'
}

// Lead level labels and colors
export const LEAD_LEVEL_LABELS: Record<LeadScoreLevel, string> = {
  cold: 'Cold',
  warm: 'Warm',
  hot: 'Hot'
}

export const LEAD_LEVEL_COLORS: Record<LeadScoreLevel, string> = {
  cold: 'blue',
  warm: 'yellow',
  hot: 'red'
}

// Default scoring thresholds
export const DEFAULT_SCORE_THRESHOLDS = {
  warm: 20,
  hot: 50
} as const

// Default scoring rules
export const DEFAULT_SCORING_RULES: Array<Omit<CreateLeadScoringRule, 'eventId'>> = [
  { name: 'Email Opened', action: 'email_opened', points: 5 },
  { name: 'Link Clicked', action: 'email_clicked', points: 10 },
  { name: 'Ticket Purchased', action: 'ticket_purchased', points: 50 },
  { name: 'Checked In', action: 'ticket_checked_in', points: 30 },
  { name: 'Talk Submitted', action: 'talk_submitted', points: 40 },
  { name: 'Talk Accepted', action: 'talk_accepted', points: 20 },
  { name: 'Joined Segment', action: 'segment_joined', points: 5 },
  { name: 'Inactive 30 days', action: 'inactivity', points: -10, inactivityDays: 30 },
  { name: 'Inactive 90 days', action: 'inactivity', points: -25, inactivityDays: 90 }
]

/**
 * Calculate lead score level based on score
 */
export function calculateLeadLevel(
  score: number,
  thresholds?: { warm: number; hot: number }
): LeadScoreLevel {
  const t = thresholds || DEFAULT_SCORE_THRESHOLDS

  if (score >= t.hot) {
    return 'hot'
  }
  if (score >= t.warm) {
    return 'warm'
  }
  return 'cold'
}

/**
 * Find applicable scoring rule for an action
 */
export function findApplicableRule(
  rules: LeadScoringRule[],
  action: ScoringAction,
  inactivityDays?: number
): LeadScoringRule | undefined {
  const activeRules = rules.filter((r) => r.isActive && r.action === action)

  if (action === 'inactivity' && inactivityDays !== undefined) {
    // Find the most specific inactivity rule that matches
    return activeRules
      .filter((r) => r.inactivityDays !== undefined && r.inactivityDays <= inactivityDays)
      .sort((a, b) => (b.inactivityDays || 0) - (a.inactivityDays || 0))[0]
  }

  return activeRules[0]
}

/**
 * Calculate new score after applying points
 */
export function applyScoreChange(currentScore: number, pointsChange: number): number {
  return currentScore + pointsChange
}

/**
 * Format score for display with sign
 */
export function formatScoreChange(points: number): string {
  if (points > 0) return `+${points}`
  return String(points)
}

/**
 * Calculate days since last activity
 */
export function calculateInactivityDays(lastActivityAt: Date | undefined): number {
  if (!lastActivityAt) return 0

  const now = new Date()
  const diffMs = now.getTime() - lastActivityAt.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if contact should receive inactivity penalty
 */
export function shouldApplyInactivityPenalty(
  lastActivityAt: Date | undefined,
  lastScoreUpdateAt: Date | undefined,
  rule: LeadScoringRule
): boolean {
  if (!lastActivityAt || !rule.inactivityDays) return false

  const inactivityDays = calculateInactivityDays(lastActivityAt)
  if (inactivityDays < rule.inactivityDays) return false

  // Don't apply if we've already applied a penalty recently
  if (lastScoreUpdateAt) {
    const daysSinceUpdate = calculateInactivityDays(lastScoreUpdateAt)
    // Only apply once per 7 days maximum
    if (daysSinceUpdate < 7) return false
  }

  return true
}

/**
 * Build score history entry
 */
export function buildScoreHistoryEntry(
  contactId: string,
  rule: LeadScoringRule | undefined,
  action: ScoringAction,
  pointsChange: number,
  previousScore: number,
  description?: string,
  metadata?: Record<string, unknown>
): Omit<LeadScoreHistory, 'id' | 'createdAt'> {
  return {
    contactId,
    ruleId: rule?.id,
    action,
    pointsChange,
    previousScore,
    newScore: previousScore + pointsChange,
    description: description || (rule ? rule.name : SCORING_ACTION_LABELS[action]),
    metadata
  }
}
