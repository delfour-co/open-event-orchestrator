import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEngagementMetricsService } from './engagement-metrics-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({})
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

describe('EngagementMetricsService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createEngagementMetricsService>

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createEngagementMetricsService(pb)
  })

  describe('getKpis', () => {
    it('should return dashboard KPIs', async () => {
      pb.collection('contacts').getList.mockResolvedValue({
        items: [],
        totalItems: 100
      })

      pb.collection('contact_activities').getList.mockResolvedValue({
        items: [],
        totalItems: 30
      })

      pb.collection('consents').getList.mockResolvedValue({
        items: [],
        totalItems: 80
      })

      const kpis = await service.getKpis('evt-1', 'last_30_days')

      expect(kpis.totalContacts).toBe(100)
      expect(kpis.activeContacts).toBe(30)
      expect(kpis.contactsWithConsent).toBe(80)
      expect(kpis.consentRate).toBe(80)
    })

    it('should calculate engagement rate', async () => {
      pb.collection('contacts').getList.mockResolvedValue({
        items: [],
        totalItems: 200
      })

      pb.collection('contact_activities').getList.mockResolvedValue({
        items: [],
        totalItems: 50
      })

      const kpis = await service.getKpis('evt-1', 'last_7_days')

      expect(kpis.engagementRate).toBe(25)
    })
  })

  describe('getSourceDistribution', () => {
    it('should return distribution by role', async () => {
      pb.collection('contact_edition_links').getFullList.mockResolvedValue([
        { role: 'speaker' },
        { role: 'speaker' },
        { role: 'attendee' },
        { role: 'attendee' },
        { role: 'attendee' },
        { role: 'sponsor' }
      ])

      const distribution = await service.getSourceDistribution('evt-1')

      expect(distribution).toHaveLength(3)
      expect(distribution.find((d) => d.source === 'speaker')?.percentage).toBeCloseTo(33.3, 1)
      expect(distribution.find((d) => d.source === 'attendee')?.percentage).toBe(50)
    })

    it('should handle empty data', async () => {
      pb.collection('contact_edition_links').getFullList.mockResolvedValue([])
      pb.collection('contacts').getList.mockResolvedValue({ items: [], totalItems: 0 })

      const distribution = await service.getSourceDistribution('evt-1')

      expect(distribution).toHaveLength(0)
    })
  })

  describe('getTopEngagedContacts', () => {
    it('should return top contacts by lead score', async () => {
      pb.collection('contacts').getList.mockResolvedValue({
        items: [
          {
            id: 'c1',
            email: 'top@example.com',
            firstName: 'Top',
            lastName: 'User',
            leadScore: 100
          },
          { id: 'c2', email: 'mid@example.com', firstName: 'Mid', lastName: 'User', leadScore: 75 },
          { id: 'c3', email: 'low@example.com', firstName: 'Low', lastName: 'User', leadScore: 50 }
        ],
        totalItems: 3
      })

      const contacts = await service.getTopEngagedContacts('evt-1', 10)

      expect(contacts).toHaveLength(3)
      expect(contacts[0].email).toBe('top@example.com')
      expect(contacts[0].engagementScore).toBe(100)
    })

    it('should respect limit', async () => {
      await service.getTopEngagedContacts('evt-1', 5)

      expect(pb.collection('contacts').getList).toHaveBeenCalledWith(1, 5, expect.anything())
    })
  })

  describe('getEmailMetrics', () => {
    it('should aggregate campaign metrics', async () => {
      pb.collection('email_campaigns').getFullList.mockResolvedValue([
        {
          sentCount: 1000,
          deliveredCount: 950,
          openedCount: 400,
          clickedCount: 100,
          bouncedCount: 50,
          unsubscribedCount: 5
        },
        {
          sentCount: 500,
          deliveredCount: 480,
          openedCount: 200,
          clickedCount: 50,
          bouncedCount: 20,
          unsubscribedCount: 2
        }
      ])

      const metrics = await service.getEmailMetrics('evt-1', 'last_30_days')

      expect(metrics.totalSent).toBe(1500)
      expect(metrics.totalDelivered).toBe(1430)
      expect(metrics.totalOpened).toBe(600)
      expect(metrics.totalClicked).toBe(150)
    })

    it('should calculate rates correctly', async () => {
      pb.collection('email_campaigns').getFullList.mockResolvedValue([
        {
          sentCount: 1000,
          deliveredCount: 950,
          openedCount: 380,
          clickedCount: 95,
          bouncedCount: 50,
          unsubscribedCount: 10
        }
      ])

      const metrics = await service.getEmailMetrics('evt-1', 'last_7_days')

      expect(metrics.deliveryRate).toBe(95)
      expect(metrics.openRate).toBe(40)
      expect(metrics.clickRate).toBe(10)
      expect(metrics.bounceRate).toBe(5)
    })

    it('should handle no campaigns', async () => {
      pb.collection('email_campaigns').getFullList.mockResolvedValue([])

      const metrics = await service.getEmailMetrics('evt-1', 'last_7_days')

      expect(metrics.totalSent).toBe(0)
      expect(metrics.openRate).toBe(0)
    })
  })

  describe('getSegmentMetrics', () => {
    it('should return metrics for each segment', async () => {
      pb.collection('segments').getFullList.mockResolvedValue([
        { id: 'seg-1', name: 'VIP' },
        { id: 'seg-2', name: 'Speakers' }
      ])

      pb.collection('segment_memberships')
        .getList.mockResolvedValueOnce({ items: [], totalItems: 50 })
        .mockResolvedValueOnce({ items: [], totalItems: 25 })

      const metrics = await service.getSegmentMetrics('evt-1')

      expect(metrics).toHaveLength(2)
      expect(metrics[0].segmentName).toBe('VIP')
      expect(metrics[0].memberCount).toBe(50)
      expect(metrics[1].segmentName).toBe('Speakers')
      expect(metrics[1].memberCount).toBe(25)
    })

    it('should handle no segments', async () => {
      pb.collection('segments').getFullList.mockResolvedValue([])

      const metrics = await service.getSegmentMetrics('evt-1')

      expect(metrics).toHaveLength(0)
    })
  })

  describe('getContactHealth', () => {
    it('should calculate health metrics', async () => {
      // Total contacts
      pb.collection('contacts')
        .getList.mockResolvedValueOnce({ items: [], totalItems: 1000 }) // total
        .mockResolvedValueOnce({ items: [], totalItems: 200 }) // inactive

      // Invalid emails (bounced)
      pb.collection('suppression_list').getList.mockResolvedValue({
        items: [],
        totalItems: 50
      })

      // With consent
      pb.collection('consents').getList.mockResolvedValue({
        items: [],
        totalItems: 900
      })

      const health = await service.getContactHealth('evt-1')

      expect(health.validEmails).toBe(950)
      expect(health.invalidEmails).toBe(50)
      expect(health.validEmailRate).toBe(95)
      expect(health.inactiveContacts).toBe(200)
      expect(health.qualityScore).toBeGreaterThan(0)
      expect(health.recommendations).toBeDefined()
    })
  })

  describe('getCampaignComparison', () => {
    it('should return campaign comparison data', async () => {
      const now = new Date()
      pb.collection('email_campaigns').getList.mockResolvedValue({
        items: [
          {
            id: 'camp-1',
            name: 'Newsletter 1',
            sentAt: now.toISOString(),
            sentCount: 1000,
            deliveredCount: 950,
            openedCount: 400,
            clickedCount: 100,
            bouncedCount: 50
          },
          {
            id: 'camp-2',
            name: 'Newsletter 2',
            sentAt: now.toISOString(),
            sentCount: 500,
            deliveredCount: 480,
            openedCount: 150,
            clickedCount: 30,
            bouncedCount: 20
          }
        ],
        totalItems: 2
      })

      const comparison = await service.getCampaignComparison('evt-1', 10)

      expect(comparison).toHaveLength(2)
      expect(comparison[0].campaignName).toBe('Newsletter 1')
      expect(comparison[0].deliveryRate).toBe(95)
      expect(comparison[0].openRate).toBeCloseTo(42.1, 1)
    })

    it('should respect limit', async () => {
      await service.getCampaignComparison('evt-1', 5)

      expect(pb.collection('email_campaigns').getList).toHaveBeenCalledWith(1, 5, expect.anything())
    })
  })

  describe('getLinkClickData', () => {
    it('should aggregate click data by URL', async () => {
      pb.collection('email_events').getFullList.mockResolvedValue([
        { metadata: { url: 'https://example.com/link1', contactId: 'c1' } },
        { metadata: { url: 'https://example.com/link1', contactId: 'c2' } },
        { metadata: { url: 'https://example.com/link1', contactId: 'c1' } },
        { metadata: { url: 'https://example.com/link2', contactId: 'c1' } }
      ])

      const linkData = await service.getLinkClickData('camp-1')

      expect(linkData).toHaveLength(2)
      expect(linkData[0].url).toBe('https://example.com/link1')
      expect(linkData[0].clickCount).toBe(3)
      expect(linkData[0].uniqueClicks).toBe(2)
    })

    it('should sort by click count', async () => {
      pb.collection('email_events').getFullList.mockResolvedValue([
        { metadata: { url: 'https://example.com/less' } },
        { metadata: { url: 'https://example.com/more' } },
        { metadata: { url: 'https://example.com/more' } },
        { metadata: { url: 'https://example.com/more' } }
      ])

      const linkData = await service.getLinkClickData('camp-1')

      expect(linkData[0].url).toBe('https://example.com/more')
      expect(linkData[0].clickCount).toBe(3)
    })
  })

  describe('getDashboardData', () => {
    it('should aggregate all dashboard data', async () => {
      // Setup mocks for all data sources
      pb.collection('contacts').getList.mockResolvedValue({ items: [], totalItems: 100 })
      pb.collection('contact_activities').getList.mockResolvedValue({ items: [], totalItems: 30 })
      pb.collection('consents').getList.mockResolvedValue({ items: [], totalItems: 80 })
      pb.collection('contact_edition_links').getFullList.mockResolvedValue([])
      pb.collection('email_campaigns').getFullList.mockResolvedValue([])
      pb.collection('segments').getFullList.mockResolvedValue([])
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [], totalItems: 0 })

      const data = await service.getDashboardData('evt-1', 'last_30_days')

      expect(data.kpis).toBeDefined()
      expect(data.contactGrowth).toBeDefined()
      expect(data.sourceDistribution).toBeDefined()
      expect(data.topEngagedContacts).toBeDefined()
      expect(data.emailMetrics).toBeDefined()
      expect(data.segmentMetrics).toBeDefined()
      expect(data.contactHealth).toBeDefined()
      expect(data.period).toBe('last_30_days')
      expect(data.generatedAt).toBeDefined()
    })
  })
})
