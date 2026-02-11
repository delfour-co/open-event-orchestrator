import { describe, expect, it } from 'vitest'
import {
  type EmailEvent,
  calculateEventStats,
  calculateLinkStats,
  generateTrackingId,
  isHardBounce,
  parseTrackingId,
  shouldSuppressContact
} from './email-event'

describe('EmailEvent Domain', () => {
  describe('generateTrackingId', () => {
    it('should generate a tracking ID that can be parsed back', () => {
      const trackingId = generateTrackingId('campaign-123', 'contact-456')
      const parsed = parseTrackingId(trackingId)
      expect(parsed).toEqual({
        campaignId: 'campaign-123',
        contactId: 'contact-456'
      })
    })

    it('should generate unique tracking IDs', () => {
      const id1 = generateTrackingId('c1', 'ct1')
      const id2 = generateTrackingId('c1', 'ct1')
      expect(id1).not.toBe(id2)
    })

    it('should handle IDs with special characters', () => {
      const trackingId = generateTrackingId('camp-with-hyphens', 'contact_with_underscores')
      const parsed = parseTrackingId(trackingId)
      expect(parsed).toEqual({
        campaignId: 'camp-with-hyphens',
        contactId: 'contact_with_underscores'
      })
    })
  })

  describe('parseTrackingId', () => {
    it('should return null for invalid tracking IDs', () => {
      expect(parseTrackingId('invalid')).toBeNull()
      expect(parseTrackingId('')).toBeNull()
      expect(parseTrackingId('not-base64!')).toBeNull()
    })

    it('should return null for malformed base64 content', () => {
      // Valid base64 but wrong format (no colons)
      const invalidContent = Buffer.from('nocolons').toString('base64url')
      expect(parseTrackingId(invalidContent)).toBeNull()
    })
  })

  describe('calculateEventStats', () => {
    const baseEvent: EmailEvent = {
      id: '1',
      campaignId: 'c1',
      contactId: 'ct1',
      type: 'opened',
      timestamp: new Date(),
      createdAt: new Date()
    }

    it('should calculate stats with no events', () => {
      const stats = calculateEventStats('c1', 100, [])
      expect(stats).toEqual({
        campaignId: 'c1',
        totalSent: 100,
        uniqueOpens: 0,
        totalOpens: 0,
        uniqueClicks: 0,
        totalClicks: 0,
        bounces: 0,
        unsubscribes: 0,
        complaints: 0,
        openRate: 0,
        clickRate: 0,
        clickToOpenRate: 0
      })
    })

    it('should calculate unique and total opens correctly', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', type: 'opened' },
        { ...baseEvent, id: '2', contactId: 'ct1', type: 'opened' }, // Same contact, second open
        { ...baseEvent, id: '3', contactId: 'ct2', type: 'opened' }
      ]
      const stats = calculateEventStats('c1', 100, events)
      expect(stats.uniqueOpens).toBe(2)
      expect(stats.totalOpens).toBe(3)
      expect(stats.openRate).toBe(2) // 2/100 * 100
    })

    it('should calculate unique and total clicks correctly', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', type: 'clicked', url: 'https://a.com' },
        { ...baseEvent, id: '2', contactId: 'ct1', type: 'clicked', url: 'https://b.com' },
        { ...baseEvent, id: '3', contactId: 'ct2', type: 'clicked', url: 'https://a.com' }
      ]
      const stats = calculateEventStats('c1', 100, events)
      expect(stats.uniqueClicks).toBe(2)
      expect(stats.totalClicks).toBe(3)
      expect(stats.clickRate).toBe(2)
    })

    it('should calculate click-to-open rate', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', type: 'opened' },
        { ...baseEvent, id: '2', contactId: 'ct2', type: 'opened' },
        { ...baseEvent, id: '3', contactId: 'ct3', type: 'opened' },
        { ...baseEvent, id: '4', contactId: 'ct4', type: 'opened' },
        { ...baseEvent, id: '5', contactId: 'ct1', type: 'clicked', url: 'https://a.com' }
      ]
      const stats = calculateEventStats('c1', 100, events)
      expect(stats.uniqueOpens).toBe(4)
      expect(stats.uniqueClicks).toBe(1)
      expect(stats.clickToOpenRate).toBe(25) // 1/4 * 100
    })

    it('should count bounces, unsubscribes, and complaints', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', type: 'bounced', bounceType: 'hard' },
        { ...baseEvent, id: '2', contactId: 'ct2', type: 'bounced', bounceType: 'soft' },
        { ...baseEvent, id: '3', contactId: 'ct3', type: 'unsubscribed' },
        { ...baseEvent, id: '4', contactId: 'ct4', type: 'complained' }
      ]
      const stats = calculateEventStats('c1', 100, events)
      expect(stats.bounces).toBe(2)
      expect(stats.unsubscribes).toBe(1)
      expect(stats.complaints).toBe(1)
    })
  })

  describe('calculateLinkStats', () => {
    const baseEvent: EmailEvent = {
      id: '1',
      campaignId: 'c1',
      contactId: 'ct1',
      type: 'clicked',
      timestamp: new Date(),
      createdAt: new Date()
    }

    it('should return empty array for no click events', () => {
      const events: EmailEvent[] = [{ ...baseEvent, type: 'opened' }]
      const stats = calculateLinkStats(events)
      expect(stats).toEqual([])
    })

    it('should calculate stats per link', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', url: 'https://a.com', linkId: 'link-a' },
        { ...baseEvent, id: '2', contactId: 'ct2', url: 'https://a.com', linkId: 'link-a' },
        { ...baseEvent, id: '3', contactId: 'ct1', url: 'https://b.com', linkId: 'link-b' }
      ]
      const stats = calculateLinkStats(events)

      expect(stats).toHaveLength(2)

      const linkA = stats.find((s) => s.linkId === 'link-a')
      expect(linkA).toEqual({
        linkId: 'link-a',
        url: 'https://a.com',
        uniqueClicks: 2,
        totalClicks: 2
      })

      const linkB = stats.find((s) => s.linkId === 'link-b')
      expect(linkB).toEqual({
        linkId: 'link-b',
        url: 'https://b.com',
        uniqueClicks: 1,
        totalClicks: 1
      })
    })

    it('should count same contact clicking same link multiple times', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', url: 'https://a.com', linkId: 'link-a' },
        { ...baseEvent, id: '2', contactId: 'ct1', url: 'https://a.com', linkId: 'link-a' }
      ]
      const stats = calculateLinkStats(events)

      expect(stats[0].uniqueClicks).toBe(1)
      expect(stats[0].totalClicks).toBe(2)
    })

    it('should use URL as linkId if not provided', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, id: '1', contactId: 'ct1', url: 'https://no-id.com' }
      ]
      const stats = calculateLinkStats(events)

      expect(stats[0].linkId).toBe('https://no-id.com')
    })
  })

  describe('isHardBounce', () => {
    it('should return true for hard bounces', () => {
      const event: EmailEvent = {
        id: '1',
        campaignId: 'c1',
        contactId: 'ct1',
        type: 'bounced',
        bounceType: 'hard',
        timestamp: new Date(),
        createdAt: new Date()
      }
      expect(isHardBounce(event)).toBe(true)
    })

    it('should return false for soft bounces', () => {
      const event: EmailEvent = {
        id: '1',
        campaignId: 'c1',
        contactId: 'ct1',
        type: 'bounced',
        bounceType: 'soft',
        timestamp: new Date(),
        createdAt: new Date()
      }
      expect(isHardBounce(event)).toBe(false)
    })

    it('should return false for non-bounce events', () => {
      const event: EmailEvent = {
        id: '1',
        campaignId: 'c1',
        contactId: 'ct1',
        type: 'opened',
        timestamp: new Date(),
        createdAt: new Date()
      }
      expect(isHardBounce(event)).toBe(false)
    })
  })

  describe('shouldSuppressContact', () => {
    const baseEvent: EmailEvent = {
      id: '1',
      campaignId: 'c1',
      contactId: 'ct1',
      type: 'opened',
      timestamp: new Date(),
      createdAt: new Date()
    }

    it('should return true for hard bounce', () => {
      const events: EmailEvent[] = [{ ...baseEvent, type: 'bounced', bounceType: 'hard' }]
      expect(shouldSuppressContact(events)).toBe(true)
    })

    it('should return true for unsubscribe', () => {
      const events: EmailEvent[] = [{ ...baseEvent, type: 'unsubscribed' }]
      expect(shouldSuppressContact(events)).toBe(true)
    })

    it('should return true for complaint', () => {
      const events: EmailEvent[] = [{ ...baseEvent, type: 'complained' }]
      expect(shouldSuppressContact(events)).toBe(true)
    })

    it('should return false for soft bounce only', () => {
      const events: EmailEvent[] = [{ ...baseEvent, type: 'bounced', bounceType: 'soft' }]
      expect(shouldSuppressContact(events)).toBe(false)
    })

    it('should return false for opens and clicks only', () => {
      const events: EmailEvent[] = [
        { ...baseEvent, type: 'opened' },
        { ...baseEvent, id: '2', type: 'clicked', url: 'https://a.com' }
      ]
      expect(shouldSuppressContact(events)).toBe(false)
    })

    it('should return false for empty events', () => {
      expect(shouldSuppressContact([])).toBe(false)
    })
  })
})
