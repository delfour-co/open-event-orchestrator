import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCampaignAnalyticsService } from './campaign-analytics-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({ id: 'new-id' }),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('CampaignAnalyticsService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createCampaignAnalyticsService>

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createCampaignAnalyticsService(pb)
  })

  describe('getCampaignAnalytics', () => {
    it('should return full analytics for a campaign', async () => {
      pb.collection('email_campaigns').getOne.mockResolvedValue({
        id: 'camp-1',
        name: 'Newsletter',
        sentCount: 100,
        sentAt: now.toISOString()
      })

      pb.collection('email_events').getFullList.mockResolvedValue([
        {
          id: 'e1',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'opened',
          timestamp: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'e2',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'clicked',
          url: 'https://example.com',
          timestamp: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
      ])

      const result = await service.getCampaignAnalytics('camp-1')

      expect(result.campaignId).toBe('camp-1')
      expect(result.campaignName).toBe('Newsletter')
      expect(result.stats.totalSent).toBe(100)
      expect(result.stats.uniqueOpens).toBe(1)
      expect(result.stats.uniqueClicks).toBe(1)
      expect(result.linkStats).toHaveLength(1)
      expect(result.topContacts).toHaveLength(1)
    })

    it('should handle campaign with no events', async () => {
      pb.collection('email_campaigns').getOne.mockResolvedValue({
        id: 'camp-1',
        name: 'Newsletter',
        sentCount: 50
      })
      pb.collection('email_events').getFullList.mockResolvedValue([])
      pb.collection('contacts').getFullList.mockResolvedValue([])

      const result = await service.getCampaignAnalytics('camp-1')

      expect(result.stats.uniqueOpens).toBe(0)
      expect(result.stats.openRate).toBe(0)
      expect(result.topContacts).toHaveLength(0)
    })
  })

  describe('getComparisonStats', () => {
    it('should return stats for multiple campaigns', async () => {
      pb.collection('email_campaigns')
        .getOne.mockResolvedValueOnce({
          id: 'camp-1',
          name: 'Campaign 1',
          sentCount: 100,
          sentAt: yesterday.toISOString()
        })
        .mockResolvedValueOnce({
          id: 'camp-2',
          name: 'Campaign 2',
          sentCount: 200,
          sentAt: now.toISOString()
        })

      pb.collection('email_events')
        .getFullList.mockResolvedValueOnce([
          {
            id: 'e1',
            campaignId: 'camp-1',
            contactId: 'c1',
            type: 'opened',
            timestamp: yesterday.toISOString(),
            created: yesterday.toISOString()
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 'e2',
            campaignId: 'camp-2',
            contactId: 'c1',
            type: 'opened',
            timestamp: now.toISOString(),
            created: now.toISOString()
          },
          {
            id: 'e3',
            campaignId: 'camp-2',
            contactId: 'c2',
            type: 'opened',
            timestamp: now.toISOString(),
            created: now.toISOString()
          }
        ])

      const result = await service.getComparisonStats(['camp-1', 'camp-2'])

      expect(result).toHaveLength(2)
      expect(result[0].campaignName).toBe('Campaign 1')
      expect(result[0].openRate).toBe(1) // 1/100
      expect(result[1].campaignName).toBe('Campaign 2')
      expect(result[1].openRate).toBe(1) // 2/200
    })

    it('should return empty array for no campaigns', async () => {
      const result = await service.getComparisonStats([])

      expect(result).toEqual([])
    })
  })

  describe('getTimeSeries', () => {
    it('should build time series from events', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      pb.collection('email_events').getFullList.mockResolvedValue([
        {
          id: 'e1',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'opened',
          timestamp: today.toISOString(),
          created: today.toISOString()
        },
        {
          id: 'e2',
          campaignId: 'camp-1',
          contactId: 'c2',
          type: 'clicked',
          timestamp: today.toISOString(),
          created: today.toISOString()
        }
      ])

      const result = await service.getTimeSeries('camp-1', 7)

      expect(result.length).toBeGreaterThan(0)
      // Find today's data point
      const todayKey = today.toISOString().split('T')[0]
      const todayPoint = result.find((p) => p.date === todayKey)
      expect(todayPoint?.opens).toBe(1)
      expect(todayPoint?.clicks).toBe(1)
    })
  })

  describe('getTopContacts', () => {
    it('should return top engaged contacts sorted by engagement', async () => {
      pb.collection('email_events').getFullList.mockResolvedValue([
        {
          id: 'e1',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'opened',
          timestamp: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'e2',
          campaignId: 'camp-1',
          contactId: 'c2',
          type: 'opened',
          timestamp: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'e3',
          campaignId: 'camp-1',
          contactId: 'c2',
          type: 'clicked',
          timestamp: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'e4',
          campaignId: 'camp-1',
          contactId: 'c2',
          type: 'clicked',
          timestamp: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', email: 'low@example.com' },
        { id: 'c2', email: 'high@example.com' }
      ])

      const result = await service.getTopContacts('camp-1', 5)

      expect(result).toHaveLength(2)
      // c2 should be first (1 open + 2 clicks = 3)
      expect(result[0].contactId).toBe('c2')
      expect(result[0].opens).toBe(1)
      expect(result[0].clicks).toBe(2)
      // c1 second (1 open = 1)
      expect(result[1].contactId).toBe('c1')
    })

    it('should return empty array for no events', async () => {
      pb.collection('email_events').getFullList.mockResolvedValue([])

      const result = await service.getTopContacts('camp-1')

      expect(result).toEqual([])
    })
  })

  describe('exportStatsCsv', () => {
    it('should export stats as CSV', async () => {
      pb.collection('email_campaigns').getOne.mockResolvedValue({
        id: 'camp-1',
        name: 'Test Campaign',
        sentCount: 100,
        sentAt: now.toISOString()
      })

      pb.collection('email_events').getFullList.mockResolvedValue([
        {
          id: 'e1',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'opened',
          timestamp: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'e2',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'clicked',
          url: 'https://example.com',
          timestamp: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('contacts').getFullList.mockResolvedValue([])

      const csv = await service.exportStatsCsv('camp-1')

      expect(csv).toContain('Campaign,Test Campaign')
      expect(csv).toContain('Total Sent,100')
      expect(csv).toContain('Unique Opens,1')
      expect(csv).toContain('Link Statistics')
      expect(csv).toContain('https://example.com')
    })
  })

  describe('exportEventsCsv', () => {
    it('should export events as CSV', async () => {
      pb.collection('email_events').getFullList.mockResolvedValue([
        {
          id: 'e1',
          campaignId: 'camp-1',
          contactId: 'c1',
          type: 'opened',
          timestamp: now.toISOString(),
          created: now.toISOString()
        }
      ])

      const csv = await service.exportEventsCsv('camp-1')

      expect(csv).toContain('Timestamp,Contact ID,Type')
      expect(csv).toContain('c1')
      expect(csv).toContain('opened')
    })
  })

  describe('getAggregateStats', () => {
    it('should aggregate stats across campaigns', async () => {
      pb.collection('email_campaigns').getFullList.mockResolvedValue([
        {
          id: 'camp-1',
          sentCount: 100,
          openCount: 20,
          clickCount: 10,
          bounceCount: 5
        },
        {
          id: 'camp-2',
          sentCount: 200,
          openCount: 60,
          clickCount: 30,
          bounceCount: 10
        }
      ])

      const result = await service.getAggregateStats({ eventId: 'evt-1' })

      expect(result.totalCampaigns).toBe(2)
      expect(result.totalSent).toBe(300)
      expect(result.avgOpenRate).toBeGreaterThan(0)
    })

    it('should return zeros for no campaigns', async () => {
      pb.collection('email_campaigns').getFullList.mockResolvedValue([])

      const result = await service.getAggregateStats({})

      expect(result.totalCampaigns).toBe(0)
      expect(result.totalSent).toBe(0)
      expect(result.avgOpenRate).toBe(0)
    })
  })
})
