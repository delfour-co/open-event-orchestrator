/**
 * Contact Activity Domain Entity
 *
 * Tracks all interactions and events related to a contact,
 * creating a chronological timeline of their engagement.
 */

import { z } from 'zod'

export const activityTypeSchema = z.enum([
  // Email activities
  'email_sent',
  'email_opened',
  'email_clicked',
  'email_bounced',
  'email_unsubscribed',
  // Ticket activities
  'ticket_purchased',
  'ticket_checked_in',
  'ticket_refunded',
  // CFP activities
  'talk_submitted',
  'talk_accepted',
  'talk_rejected',
  // Consent activities
  'consent_granted',
  'consent_revoked',
  // Tag activities
  'tag_added',
  'tag_removed',
  // Profile activities
  'contact_created',
  'contact_updated',
  'contact_imported',
  'contact_synced',
  // Segment activities
  'segment_joined',
  'segment_left'
])

export type ActivityType = z.infer<typeof activityTypeSchema>

export const contactActivitySchema = z.object({
  id: z.string(),
  contactId: z.string(),
  eventId: z.string().optional(),
  editionId: z.string().optional(),
  type: activityTypeSchema,
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date()
})

export type ContactActivity = z.infer<typeof contactActivitySchema>

export interface CreateContactActivity {
  contactId: string
  eventId?: string
  editionId?: string
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
}

export interface ActivityFilterOptions {
  contactId: string
  types?: ActivityType[]
  eventId?: string
  editionId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  perPage?: number
}

export interface EngagementScore {
  contactId: string
  score: number
  level: 'active' | 'moderate' | 'inactive'
  lastActivityAt?: Date
  activityCount: number
}

// Activity type labels for UI
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email_sent: 'Email Sent',
  email_opened: 'Email Opened',
  email_clicked: 'Link Clicked',
  email_bounced: 'Email Bounced',
  email_unsubscribed: 'Unsubscribed',
  ticket_purchased: 'Ticket Purchased',
  ticket_checked_in: 'Checked In',
  ticket_refunded: 'Ticket Refunded',
  talk_submitted: 'Talk Submitted',
  talk_accepted: 'Talk Accepted',
  talk_rejected: 'Talk Rejected',
  consent_granted: 'Consent Granted',
  consent_revoked: 'Consent Revoked',
  tag_added: 'Tag Added',
  tag_removed: 'Tag Removed',
  contact_created: 'Contact Created',
  contact_updated: 'Contact Updated',
  contact_imported: 'Imported',
  contact_synced: 'Synced',
  segment_joined: 'Joined Segment',
  segment_left: 'Left Segment'
}

// Activity type icons (Lucide icon names)
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  email_sent: 'mail',
  email_opened: 'mail-open',
  email_clicked: 'mouse-pointer-click',
  email_bounced: 'mail-x',
  email_unsubscribed: 'user-minus',
  ticket_purchased: 'ticket',
  ticket_checked_in: 'check-circle',
  ticket_refunded: 'undo',
  talk_submitted: 'file-text',
  talk_accepted: 'check',
  talk_rejected: 'x',
  consent_granted: 'shield-check',
  consent_revoked: 'shield-x',
  tag_added: 'tag',
  tag_removed: 'tag',
  contact_created: 'user-plus',
  contact_updated: 'user-cog',
  contact_imported: 'import',
  contact_synced: 'refresh-cw',
  segment_joined: 'users',
  segment_left: 'user-minus'
}

// Activity type categories for filtering
export const ACTIVITY_CATEGORIES = {
  email: ['email_sent', 'email_opened', 'email_clicked', 'email_bounced', 'email_unsubscribed'],
  ticket: ['ticket_purchased', 'ticket_checked_in', 'ticket_refunded'],
  cfp: ['talk_submitted', 'talk_accepted', 'talk_rejected'],
  consent: ['consent_granted', 'consent_revoked'],
  profile: [
    'contact_created',
    'contact_updated',
    'contact_imported',
    'contact_synced',
    'tag_added',
    'tag_removed'
  ],
  segment: ['segment_joined', 'segment_left']
} as const

export type ActivityCategory = keyof typeof ACTIVITY_CATEGORIES

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  email: 'Email',
  ticket: 'Tickets',
  cfp: 'CFP',
  consent: 'Consent',
  profile: 'Profile',
  segment: 'Segments'
}

// Engagement score configuration
export const ENGAGEMENT_CONFIG = {
  // Points per activity type (higher = more valuable engagement)
  ACTIVITY_POINTS: {
    email_opened: 5,
    email_clicked: 10,
    ticket_purchased: 50,
    ticket_checked_in: 30,
    talk_submitted: 40,
    talk_accepted: 20,
    consent_granted: 15,
    segment_joined: 5,
    // Negative or neutral activities
    email_bounced: -10,
    email_unsubscribed: -20,
    consent_revoked: -15,
    ticket_refunded: -30,
    talk_rejected: 0,
    segment_left: -5,
    // Neutral activities
    email_sent: 0,
    tag_added: 0,
    tag_removed: 0,
    contact_created: 0,
    contact_updated: 0,
    contact_imported: 0,
    contact_synced: 0
  } as Record<ActivityType, number>,
  // Recency decay: points are multiplied by this factor based on age
  RECENCY_DECAY_DAYS: 90, // Activities older than this get reduced weight
  RECENCY_DECAY_FACTOR: 0.5, // Factor for old activities
  // Score thresholds
  ACTIVE_THRESHOLD: 50,
  MODERATE_THRESHOLD: 20
} as const

/**
 * Calculate engagement score from activities
 */
export function calculateEngagementScore(activities: ContactActivity[]): EngagementScore {
  if (activities.length === 0) {
    return {
      contactId: '',
      score: 0,
      level: 'inactive',
      activityCount: 0
    }
  }

  const contactId = activities[0].contactId
  const now = new Date()
  const decayDate = new Date(
    now.getTime() - ENGAGEMENT_CONFIG.RECENCY_DECAY_DAYS * 24 * 60 * 60 * 1000
  )

  let score = 0
  let lastActivityAt: Date | undefined

  for (const activity of activities) {
    const points = ENGAGEMENT_CONFIG.ACTIVITY_POINTS[activity.type] || 0
    const isRecent = activity.createdAt > decayDate
    const weight = isRecent ? 1 : ENGAGEMENT_CONFIG.RECENCY_DECAY_FACTOR

    score += points * weight

    if (!lastActivityAt || activity.createdAt > lastActivityAt) {
      lastActivityAt = activity.createdAt
    }
  }

  // Determine engagement level
  let level: 'active' | 'moderate' | 'inactive' = 'inactive'
  if (score >= ENGAGEMENT_CONFIG.ACTIVE_THRESHOLD) {
    level = 'active'
  } else if (score >= ENGAGEMENT_CONFIG.MODERATE_THRESHOLD) {
    level = 'moderate'
  }

  return {
    contactId,
    score: Math.round(score),
    level,
    lastActivityAt,
    activityCount: activities.length
  }
}

/**
 * Get activities by category
 */
export function filterActivitiesByCategory(
  activities: ContactActivity[],
  category: ActivityCategory
): ContactActivity[] {
  const typesInCategory = ACTIVITY_CATEGORIES[category] as readonly string[]
  return activities.filter((a) => typesInCategory.includes(a.type))
}

/**
 * Group activities by date for timeline display
 */
export function groupActivitiesByDate(
  activities: ContactActivity[]
): Map<string, ContactActivity[]> {
  const grouped = new Map<string, ContactActivity[]>()

  for (const activity of activities) {
    const dateKey = activity.createdAt.toISOString().split('T')[0]
    const existing = grouped.get(dateKey) || []
    existing.push(activity)
    grouped.set(dateKey, existing)
  }

  return grouped
}
