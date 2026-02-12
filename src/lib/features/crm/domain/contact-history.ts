/**
 * Contact History Domain Entity
 *
 * Tracks contact participation across multiple events and editions.
 */

import { z } from 'zod'

export const eventParticipationTypeSchema = z.enum([
  'registered',
  'ticket_purchased',
  'checked_in',
  'talk_submitted',
  'talk_accepted',
  'talk_rejected',
  'speaker',
  'volunteer',
  'sponsor_contact'
])
export type EventParticipationType = z.infer<typeof eventParticipationTypeSchema>

export const contactEventParticipationSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  eventId: z.string(),
  editionId: z.string(),
  participationType: eventParticipationTypeSchema,
  relatedEntityId: z.string().optional(), // order id, talk id, etc.
  relatedEntityType: z.string().optional(), // order, talk, volunteer, etc.
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.date(),
  createdAt: z.date()
})

export type ContactEventParticipation = z.infer<typeof contactEventParticipationSchema>

export interface ContactTimelineEntry {
  id: string
  participationType: EventParticipationType
  eventName: string
  editionName: string
  eventId: string
  editionId: string
  description: string
  occurredAt: Date
  metadata?: Record<string, unknown>
}

export interface ContactCrossEventSummary {
  contactId: string
  email: string
  firstName: string
  lastName: string
  totalEvents: number
  totalEditions: number
  firstParticipation: Date | null
  lastParticipation: Date | null
  participationTypes: EventParticipationType[]
  loyaltyScore: number
}

// Participation type labels for UI
export const PARTICIPATION_TYPE_LABELS: Record<EventParticipationType, string> = {
  registered: 'Registered',
  ticket_purchased: 'Purchased Ticket',
  checked_in: 'Checked In',
  talk_submitted: 'Submitted Talk',
  talk_accepted: 'Talk Accepted',
  talk_rejected: 'Talk Rejected',
  speaker: 'Speaker',
  volunteer: 'Volunteer',
  sponsor_contact: 'Sponsor Contact'
}

// Participation type icons
export const PARTICIPATION_TYPE_ICONS: Record<EventParticipationType, string> = {
  registered: 'user-plus',
  ticket_purchased: 'ticket',
  checked_in: 'check-circle',
  talk_submitted: 'file-text',
  talk_accepted: 'check',
  talk_rejected: 'x',
  speaker: 'mic',
  volunteer: 'heart',
  sponsor_contact: 'briefcase'
}

// Participation type weights for loyalty scoring
export const PARTICIPATION_WEIGHTS: Record<EventParticipationType, number> = {
  registered: 1,
  ticket_purchased: 5,
  checked_in: 10,
  talk_submitted: 3,
  talk_accepted: 8,
  talk_rejected: 2,
  speaker: 15,
  volunteer: 12,
  sponsor_contact: 5
}

/**
 * Calculate loyalty score based on participation history
 */
export function calculateLoyaltyScore(participations: ContactEventParticipation[]): number {
  if (participations.length === 0) return 0

  // Get unique editions
  const uniqueEditions = new Set(participations.map((p) => p.editionId))

  // Base score: points per unique edition
  let score = uniqueEditions.size * 10

  // Add participation type weights
  for (const participation of participations) {
    score += PARTICIPATION_WEIGHTS[participation.participationType] || 0
  }

  // Bonus for consistent attendance (multiple events)
  const uniqueEvents = new Set(participations.map((p) => p.eventId))
  if (uniqueEvents.size >= 2) {
    score += uniqueEvents.size * 5
  }

  // Recency bonus (participation in last year)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const recentParticipations = participations.filter((p) => p.occurredAt >= oneYearAgo)
  if (recentParticipations.length > 0) {
    score += 20
  }

  return score
}

/**
 * Get participation types from history
 */
export function getParticipationTypes(
  participations: ContactEventParticipation[]
): EventParticipationType[] {
  return [...new Set(participations.map((p) => p.participationType))]
}

/**
 * Build timeline description for a participation
 */
export function buildParticipationDescription(
  participation: ContactEventParticipation,
  _eventName: string,
  editionName: string
): string {
  const baseLabel = PARTICIPATION_TYPE_LABELS[participation.participationType]

  switch (participation.participationType) {
    case 'ticket_purchased':
      return `${baseLabel} for ${editionName}`
    case 'checked_in':
      return `${baseLabel} at ${editionName}`
    case 'talk_submitted':
      return `${baseLabel} to ${editionName}`
    case 'talk_accepted':
      return `${baseLabel} at ${editionName}`
    case 'talk_rejected':
      return `${baseLabel} for ${editionName}`
    case 'speaker':
      return `Spoke at ${editionName}`
    case 'volunteer':
      return `Volunteered at ${editionName}`
    default:
      return `${baseLabel} - ${editionName}`
  }
}

/**
 * Group participations by edition
 */
export function groupParticipationsByEdition(
  participations: ContactEventParticipation[]
): Map<string, ContactEventParticipation[]> {
  const grouped = new Map<string, ContactEventParticipation[]>()

  for (const participation of participations) {
    const existing = grouped.get(participation.editionId) || []
    existing.push(participation)
    grouped.set(participation.editionId, existing)
  }

  return grouped
}

/**
 * Sort participations by date (most recent first)
 */
export function sortParticipationsByDate(
  participations: ContactEventParticipation[]
): ContactEventParticipation[] {
  return [...participations].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
}

/**
 * Build cross-event summary from participations
 */
export function buildCrossEventSummary(
  contact: { id: string; email: string; firstName: string; lastName: string },
  participations: ContactEventParticipation[]
): ContactCrossEventSummary {
  const sortedParticipations = sortParticipationsByDate(participations)
  const uniqueEvents = new Set(participations.map((p) => p.eventId))
  const uniqueEditions = new Set(participations.map((p) => p.editionId))

  return {
    contactId: contact.id,
    email: contact.email,
    firstName: contact.firstName,
    lastName: contact.lastName,
    totalEvents: uniqueEvents.size,
    totalEditions: uniqueEditions.size,
    firstParticipation:
      sortedParticipations.length > 0
        ? sortedParticipations[sortedParticipations.length - 1].occurredAt
        : null,
    lastParticipation: sortedParticipations.length > 0 ? sortedParticipations[0].occurredAt : null,
    participationTypes: getParticipationTypes(participations),
    loyaltyScore: calculateLoyaltyScore(participations)
  }
}

/**
 * Determine loyalty level based on score
 */
export function getLoyaltyLevel(score: number): 'new' | 'returning' | 'loyal' | 'champion' {
  if (score >= 100) return 'champion'
  if (score >= 50) return 'loyal'
  if (score >= 20) return 'returning'
  return 'new'
}

// Loyalty level labels and colors
export const LOYALTY_LEVEL_LABELS = {
  new: 'New',
  returning: 'Returning',
  loyal: 'Loyal',
  champion: 'Champion'
} as const

export const LOYALTY_LEVEL_COLORS = {
  new: 'gray',
  returning: 'blue',
  loyal: 'green',
  champion: 'gold'
} as const
