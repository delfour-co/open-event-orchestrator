import { z } from 'zod'

/**
 * Tracks contact membership in segments over time
 */
export const segmentMembershipSchema = z.object({
  id: z.string(),
  segmentId: z.string(),
  contactId: z.string(),
  joinedAt: z.date(),
  leftAt: z.date().optional(),
  isActive: z.boolean().default(true)
})

export type SegmentMembership = z.infer<typeof segmentMembershipSchema>

export type CreateSegmentMembership = Omit<SegmentMembership, 'id'>

/**
 * Segment membership change event
 */
export type MembershipChangeType = 'joined' | 'left'

export interface MembershipChange {
  segmentId: string
  contactId: string
  changeType: MembershipChangeType
  timestamp: Date
}

/**
 * Calculate membership changes between old and new contact sets
 */
export function calculateMembershipChanges(
  segmentId: string,
  previousContactIds: Set<string>,
  currentContactIds: Set<string>
): MembershipChange[] {
  const changes: MembershipChange[] = []
  const now = new Date()

  // Contacts that joined (in current but not in previous)
  for (const contactId of currentContactIds) {
    if (!previousContactIds.has(contactId)) {
      changes.push({
        segmentId,
        contactId,
        changeType: 'joined',
        timestamp: now
      })
    }
  }

  // Contacts that left (in previous but not in current)
  for (const contactId of previousContactIds) {
    if (!currentContactIds.has(contactId)) {
      changes.push({
        segmentId,
        contactId,
        changeType: 'left',
        timestamp: now
      })
    }
  }

  return changes
}

/**
 * Get segment membership statistics
 */
export interface SegmentMembershipStats {
  totalMembers: number
  joinedLast24h: number
  leftLast24h: number
  joinedLast7d: number
  leftLast7d: number
}

export function calculateMembershipStats(
  memberships: SegmentMembership[],
  allChanges: MembershipChange[]
): SegmentMembershipStats {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const activeMembers = memberships.filter((m) => m.isActive)
  const recentChanges = allChanges.filter((c) => c.timestamp >= sevenDaysAgo)

  return {
    totalMembers: activeMembers.length,
    joinedLast24h: recentChanges.filter(
      (c) => c.changeType === 'joined' && c.timestamp >= oneDayAgo
    ).length,
    leftLast24h: recentChanges.filter((c) => c.changeType === 'left' && c.timestamp >= oneDayAgo)
      .length,
    joinedLast7d: recentChanges.filter((c) => c.changeType === 'joined').length,
    leftLast7d: recentChanges.filter((c) => c.changeType === 'left').length
  }
}
