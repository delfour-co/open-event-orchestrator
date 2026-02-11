import { describe, expect, it } from 'vitest'
import {
  type MembershipChange,
  type SegmentMembership,
  calculateMembershipChanges,
  calculateMembershipStats
} from './segment-membership'

describe('SegmentMembership', () => {
  describe('calculateMembershipChanges', () => {
    it('should detect contacts that joined', () => {
      const previous = new Set(['c1', 'c2'])
      const current = new Set(['c1', 'c2', 'c3', 'c4'])

      const changes = calculateMembershipChanges('seg-1', previous, current)

      const joined = changes.filter((c) => c.changeType === 'joined')
      expect(joined).toHaveLength(2)
      expect(joined.map((c) => c.contactId).sort()).toEqual(['c3', 'c4'])
    })

    it('should detect contacts that left', () => {
      const previous = new Set(['c1', 'c2', 'c3'])
      const current = new Set(['c1'])

      const changes = calculateMembershipChanges('seg-1', previous, current)

      const left = changes.filter((c) => c.changeType === 'left')
      expect(left).toHaveLength(2)
      expect(left.map((c) => c.contactId).sort()).toEqual(['c2', 'c3'])
    })

    it('should detect both joins and leaves', () => {
      const previous = new Set(['c1', 'c2'])
      const current = new Set(['c2', 'c3'])

      const changes = calculateMembershipChanges('seg-1', previous, current)

      expect(changes).toHaveLength(2)
      expect(changes.find((c) => c.contactId === 'c1')?.changeType).toBe('left')
      expect(changes.find((c) => c.contactId === 'c3')?.changeType).toBe('joined')
    })

    it('should return empty array when no changes', () => {
      const previous = new Set(['c1', 'c2'])
      const current = new Set(['c1', 'c2'])

      const changes = calculateMembershipChanges('seg-1', previous, current)

      expect(changes).toHaveLength(0)
    })

    it('should handle empty previous set', () => {
      const previous = new Set<string>()
      const current = new Set(['c1', 'c2'])

      const changes = calculateMembershipChanges('seg-1', previous, current)

      expect(changes).toHaveLength(2)
      expect(changes.every((c) => c.changeType === 'joined')).toBe(true)
    })

    it('should handle empty current set', () => {
      const previous = new Set(['c1', 'c2'])
      const current = new Set<string>()

      const changes = calculateMembershipChanges('seg-1', previous, current)

      expect(changes).toHaveLength(2)
      expect(changes.every((c) => c.changeType === 'left')).toBe(true)
    })

    it('should include segment ID in all changes', () => {
      const previous = new Set(['c1'])
      const current = new Set(['c2'])

      const changes = calculateMembershipChanges('seg-123', previous, current)

      expect(changes.every((c) => c.segmentId === 'seg-123')).toBe(true)
    })

    it('should include timestamp in all changes', () => {
      const previous = new Set(['c1'])
      const current = new Set(['c2'])
      const before = new Date()

      const changes = calculateMembershipChanges('seg-1', previous, current)

      const after = new Date()
      for (const change of changes) {
        expect(change.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(change.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
      }
    })
  })

  describe('calculateMembershipStats', () => {
    const now = new Date()
    const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000)

    it('should count total active members', () => {
      const memberships: SegmentMembership[] = [
        { id: '1', segmentId: 'seg-1', contactId: 'c1', joinedAt: hoursAgo(48), isActive: true },
        { id: '2', segmentId: 'seg-1', contactId: 'c2', joinedAt: hoursAgo(24), isActive: true },
        { id: '3', segmentId: 'seg-1', contactId: 'c3', joinedAt: hoursAgo(12), isActive: false }
      ]

      const stats = calculateMembershipStats(memberships, [])

      expect(stats.totalMembers).toBe(2)
    })

    it('should count joins in last 24 hours', () => {
      const changes: MembershipChange[] = [
        { segmentId: 'seg-1', contactId: 'c1', changeType: 'joined', timestamp: hoursAgo(12) },
        { segmentId: 'seg-1', contactId: 'c2', changeType: 'joined', timestamp: hoursAgo(6) },
        { segmentId: 'seg-1', contactId: 'c3', changeType: 'joined', timestamp: hoursAgo(30) }
      ]

      const stats = calculateMembershipStats([], changes)

      expect(stats.joinedLast24h).toBe(2)
    })

    it('should count leaves in last 24 hours', () => {
      const changes: MembershipChange[] = [
        { segmentId: 'seg-1', contactId: 'c1', changeType: 'left', timestamp: hoursAgo(12) },
        { segmentId: 'seg-1', contactId: 'c2', changeType: 'left', timestamp: hoursAgo(30) }
      ]

      const stats = calculateMembershipStats([], changes)

      expect(stats.leftLast24h).toBe(1)
    })

    it('should count joins in last 7 days', () => {
      const changes: MembershipChange[] = [
        { segmentId: 'seg-1', contactId: 'c1', changeType: 'joined', timestamp: hoursAgo(12) },
        { segmentId: 'seg-1', contactId: 'c2', changeType: 'joined', timestamp: hoursAgo(72) },
        { segmentId: 'seg-1', contactId: 'c3', changeType: 'joined', timestamp: hoursAgo(150) },
        { segmentId: 'seg-1', contactId: 'c4', changeType: 'joined', timestamp: hoursAgo(200) }
      ]

      const stats = calculateMembershipStats([], changes)

      expect(stats.joinedLast7d).toBe(3) // 12h, 72h, 150h are within 168h (7 days)
    })

    it('should count leaves in last 7 days', () => {
      const changes: MembershipChange[] = [
        { segmentId: 'seg-1', contactId: 'c1', changeType: 'left', timestamp: hoursAgo(12) },
        { segmentId: 'seg-1', contactId: 'c2', changeType: 'left', timestamp: hoursAgo(200) }
      ]

      const stats = calculateMembershipStats([], changes)

      expect(stats.leftLast7d).toBe(1)
    })

    it('should return zeros for empty data', () => {
      const stats = calculateMembershipStats([], [])

      expect(stats.totalMembers).toBe(0)
      expect(stats.joinedLast24h).toBe(0)
      expect(stats.leftLast24h).toBe(0)
      expect(stats.joinedLast7d).toBe(0)
      expect(stats.leftLast7d).toBe(0)
    })
  })
})
