import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  ENGAGEMENT_CONFIG,
  calculateEngagementScore,
  filterActivitiesByCategory,
  groupActivitiesByDate
} from './contact-activity'
import type { ActivityCategory, ActivityType, ContactActivity } from './contact-activity'

describe('Contact Activity', () => {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  const makeActivity = (overrides: Partial<ContactActivity> = {}): ContactActivity => ({
    id: 'act-001',
    contactId: 'c1',
    type: 'email_opened',
    description: 'Opened campaign "Newsletter"',
    createdAt: now,
    ...overrides
  })

  describe('ACTIVITY_TYPE_LABELS', () => {
    it('should have labels for all activity types', () => {
      const allTypes: ActivityType[] = [
        'email_sent',
        'email_opened',
        'email_clicked',
        'email_bounced',
        'email_unsubscribed',
        'ticket_purchased',
        'ticket_checked_in',
        'ticket_refunded',
        'talk_submitted',
        'talk_accepted',
        'talk_rejected',
        'consent_granted',
        'consent_revoked',
        'tag_added',
        'tag_removed',
        'contact_created',
        'contact_updated',
        'contact_imported',
        'contact_synced',
        'segment_joined',
        'segment_left'
      ]

      for (const type of allTypes) {
        expect(ACTIVITY_TYPE_LABELS[type]).toBeDefined()
        expect(typeof ACTIVITY_TYPE_LABELS[type]).toBe('string')
      }
    })
  })

  describe('ACTIVITY_TYPE_ICONS', () => {
    it('should have icons for all activity types', () => {
      for (const type of Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]) {
        expect(ACTIVITY_TYPE_ICONS[type]).toBeDefined()
      }
    })
  })

  describe('ACTIVITY_CATEGORIES', () => {
    it('should categorize email activities', () => {
      expect(ACTIVITY_CATEGORIES.email).toContain('email_sent')
      expect(ACTIVITY_CATEGORIES.email).toContain('email_opened')
      expect(ACTIVITY_CATEGORIES.email).toContain('email_clicked')
    })

    it('should categorize ticket activities', () => {
      expect(ACTIVITY_CATEGORIES.ticket).toContain('ticket_purchased')
      expect(ACTIVITY_CATEGORIES.ticket).toContain('ticket_checked_in')
    })

    it('should categorize cfp activities', () => {
      expect(ACTIVITY_CATEGORIES.cfp).toContain('talk_submitted')
      expect(ACTIVITY_CATEGORIES.cfp).toContain('talk_accepted')
    })

    it('should have labels for all categories', () => {
      for (const category of Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[]) {
        expect(ACTIVITY_CATEGORY_LABELS[category]).toBeDefined()
      }
    })
  })

  describe('calculateEngagementScore', () => {
    it('should return zero score for empty activities', () => {
      const result = calculateEngagementScore([])

      expect(result.score).toBe(0)
      expect(result.level).toBe('inactive')
      expect(result.activityCount).toBe(0)
    })

    it('should calculate score based on activity points', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'email_opened', createdAt: now }), // 5 points
        makeActivity({ type: 'email_clicked', createdAt: now }) // 10 points
      ]

      const result = calculateEngagementScore(activities)

      expect(result.score).toBe(15)
      expect(result.activityCount).toBe(2)
    })

    it('should classify as active when score is high', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'ticket_purchased', createdAt: now }), // 50 points
        makeActivity({ type: 'ticket_checked_in', createdAt: now }) // 30 points
      ]

      const result = calculateEngagementScore(activities)

      expect(result.level).toBe('active')
      expect(result.score).toBeGreaterThanOrEqual(ENGAGEMENT_CONFIG.ACTIVE_THRESHOLD)
    })

    it('should classify as moderate when score is medium', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'email_opened', createdAt: now }), // 5
        makeActivity({ type: 'email_opened', createdAt: yesterday }), // 5
        makeActivity({ type: 'email_clicked', createdAt: lastWeek }) // 10
      ]

      const result = calculateEngagementScore(activities)

      expect(result.level).toBe('moderate')
    })

    it('should classify as inactive when score is low', () => {
      const activities: ContactActivity[] = [makeActivity({ type: 'email_sent', createdAt: now })] // 0 points

      const result = calculateEngagementScore(activities)

      expect(result.level).toBe('inactive')
    })

    it('should apply recency decay for old activities', () => {
      const recentActivities: ContactActivity[] = [
        makeActivity({ type: 'ticket_purchased', createdAt: now }) // 50 points, full
      ]

      const oldActivities: ContactActivity[] = [
        makeActivity({ type: 'ticket_purchased', createdAt: sixMonthsAgo }) // 50 * 0.5 = 25
      ]

      const recentScore = calculateEngagementScore(recentActivities)
      const oldScore = calculateEngagementScore(oldActivities)

      expect(recentScore.score).toBeGreaterThan(oldScore.score)
    })

    it('should handle negative point activities', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'email_bounced', createdAt: now }), // -10
        makeActivity({ type: 'email_unsubscribed', createdAt: now }) // -20
      ]

      const result = calculateEngagementScore(activities)

      expect(result.score).toBe(-30)
      expect(result.level).toBe('inactive')
    })

    it('should track last activity date', () => {
      const activities: ContactActivity[] = [
        makeActivity({ id: '1', createdAt: lastWeek }),
        makeActivity({ id: '2', createdAt: yesterday }),
        makeActivity({ id: '3', createdAt: now })
      ]

      const result = calculateEngagementScore(activities)

      expect(result.lastActivityAt).toEqual(now)
    })
  })

  describe('filterActivitiesByCategory', () => {
    it('should filter email activities', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'email_opened' }),
        makeActivity({ type: 'ticket_purchased' }),
        makeActivity({ type: 'email_clicked' })
      ]

      const filtered = filterActivitiesByCategory(activities, 'email')

      expect(filtered).toHaveLength(2)
      expect(filtered.every((a) => a.type.startsWith('email_'))).toBe(true)
    })

    it('should filter ticket activities', () => {
      const activities: ContactActivity[] = [
        makeActivity({ type: 'ticket_purchased' }),
        makeActivity({ type: 'email_opened' }),
        makeActivity({ type: 'ticket_checked_in' })
      ]

      const filtered = filterActivitiesByCategory(activities, 'ticket')

      expect(filtered).toHaveLength(2)
    })

    it('should return empty array if no matches', () => {
      const activities: ContactActivity[] = [makeActivity({ type: 'email_opened' })]

      const filtered = filterActivitiesByCategory(activities, 'ticket')

      expect(filtered).toHaveLength(0)
    })
  })

  describe('groupActivitiesByDate', () => {
    it('should group activities by date', () => {
      const date1 = new Date('2024-01-15T10:00:00Z')
      const date2 = new Date('2024-01-15T14:00:00Z')
      const date3 = new Date('2024-01-16T10:00:00Z')

      const activities: ContactActivity[] = [
        makeActivity({ id: '1', createdAt: date1 }),
        makeActivity({ id: '2', createdAt: date2 }),
        makeActivity({ id: '3', createdAt: date3 })
      ]

      const grouped = groupActivitiesByDate(activities)

      expect(grouped.size).toBe(2)
      expect(grouped.get('2024-01-15')).toHaveLength(2)
      expect(grouped.get('2024-01-16')).toHaveLength(1)
    })

    it('should handle empty array', () => {
      const grouped = groupActivitiesByDate([])

      expect(grouped.size).toBe(0)
    })
  })
})
