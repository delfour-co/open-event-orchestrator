import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCrmStatsService } from './crm-stats-service'

describe('CrmStatsService', () => {
  let mockPb: PocketBase
  let service: ReturnType<typeof createCrmStatsService>

  beforeEach(() => {
    mockPb = {
      collection: vi.fn()
    } as unknown as PocketBase
    service = createCrmStatsService(mockPb)
  })

  describe('getContactStats', () => {
    it('should return contact statistics for an edition', async () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      const olderDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000) // 40 days ago

      const mockLinks = [
        { id: '1', roles: JSON.stringify(['speaker']), created: recentDate.toISOString() },
        { id: '2', roles: JSON.stringify(['attendee']), created: recentDate.toISOString() },
        {
          id: '3',
          roles: JSON.stringify(['speaker', 'attendee']),
          created: olderDate.toISOString()
        }
      ]

      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(mockLinks)
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getContactStats('edition-1')

      expect(result.totalContacts).toBe(3)
      expect(result.newContactsThisPeriod).toBe(2)
      expect(result.contactsByRole).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'speaker', count: 2 }),
          expect.objectContaining({ role: 'attendee', count: 2 })
        ])
      )
    })

    it('should handle empty results gracefully', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getContactStats('edition-1')

      expect(result.totalContacts).toBe(0)
      expect(result.newContactsThisPeriod).toBe(0)
      expect(result.growthRate).toBe(0)
      expect(result.contactsByRole).toEqual([])
    })

    it('should handle collection errors gracefully', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockRejectedValue(new Error('Collection not found'))
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getContactStats('edition-1')

      expect(result.totalContacts).toBe(0)
    })

    it('should calculate growth rate correctly', async () => {
      const now = new Date()
      const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      const previousPeriodDate = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

      const mockLinks = [
        { id: '1', roles: '[]', created: recentDate.toISOString() },
        { id: '2', roles: '[]', created: recentDate.toISOString() },
        { id: '3', roles: '[]', created: previousPeriodDate.toISOString() }
      ]

      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(mockLinks)
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getContactStats('edition-1')

      expect(result.newContactsThisPeriod).toBe(2)
      expect(result.previousPeriodContacts).toBe(1)
      expect(result.growthRate).toBe(100) // 2 vs 1 = 100% growth
    })
  })

  describe('getCampaignStats', () => {
    it('should return campaign statistics for an edition', async () => {
      const sentAt = new Date()

      const mockCampaigns = {
        totalItems: 2,
        items: [
          {
            id: 'c1',
            name: 'Campaign 1',
            sentAt: sentAt.toISOString(),
            totalSent: 100,
            totalRecipients: 100
          },
          {
            id: 'c2',
            name: 'Campaign 2',
            sentAt: sentAt.toISOString(),
            totalSent: 50,
            totalRecipients: 50
          }
        ]
      }

      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'email_campaigns') {
          return {
            getList: vi.fn().mockResolvedValue(mockCampaigns)
          }
        }
        if (name === 'email_events') {
          return {
            getList: vi.fn().mockResolvedValue({ totalItems: 10 })
          }
        }
        return { getList: vi.fn().mockResolvedValue({ totalItems: 0 }) }
      })

      mockPb.collection = mockCollection

      const result = await service.getCampaignStats('edition-1')

      expect(result.totalCampaigns).toBe(2)
      expect(result.recentCampaigns).toHaveLength(2)
      expect(result.recentCampaigns[0].name).toBe('Campaign 1')
    })

    it('should handle no campaigns gracefully', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 0, items: [] })
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getCampaignStats('edition-1')

      expect(result.totalCampaigns).toBe(0)
      expect(result.recentCampaigns).toEqual([])
      expect(result.averageOpenRate).toBe(0)
      expect(result.averageClickRate).toBe(0)
    })

    it('should calculate average rates correctly', async () => {
      const sentAt = new Date()

      const mockCampaigns = {
        totalItems: 1,
        items: [
          {
            id: 'c1',
            name: 'Campaign 1',
            sentAt: sentAt.toISOString(),
            totalSent: 100,
            totalRecipients: 100
          }
        ]
      }

      let eventCallCount = 0
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'email_campaigns') {
          return {
            getList: vi.fn().mockResolvedValue(mockCampaigns)
          }
        }
        if (name === 'email_events') {
          eventCallCount++
          // First call is for opens, second for clicks
          return {
            getList: vi.fn().mockResolvedValue({ totalItems: eventCallCount === 1 ? 25 : 10 })
          }
        }
        return { getList: vi.fn().mockResolvedValue({ totalItems: 0 }) }
      })

      mockPb.collection = mockCollection

      const result = await service.getCampaignStats('edition-1')

      expect(result.recentCampaigns[0].openRate).toBe(25) // 25/100 * 100
      expect(result.recentCampaigns[0].clickRate).toBe(10) // 10/100 * 100
    })
  })

  describe('getEngagementStats', () => {
    it('should return engagement statistics for an edition', async () => {
      const mockLinks = [
        { contactId: 'c1', expand: { contactId: { leadScore: 60 } } }, // hot
        { contactId: 'c2', expand: { contactId: { leadScore: 30 } } }, // warm
        { contactId: 'c3', expand: { contactId: { leadScore: 10 } } } // cold
      ]

      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(mockLinks)
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getEngagementStats('edition-1')

      expect(result.hotLeadsCount).toBe(1)
      expect(result.warmLeadsCount).toBe(1)
      expect(result.coldLeadsCount).toBe(1)
      expect(result.averageEngagementScore).toBeCloseTo(33.3, 0)
    })

    it('should handle contacts without lead scores', async () => {
      const mockLinks = [
        { contactId: 'c1', expand: { contactId: {} } },
        { contactId: 'c2', expand: null }
      ]

      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(mockLinks)
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getEngagementStats('edition-1')

      expect(result.coldLeadsCount).toBe(2)
      expect(result.averageEngagementScore).toBe(0)
    })

    it('should calculate engagement distribution percentages correctly', async () => {
      const mockLinks = [
        { contactId: 'c1', expand: { contactId: { leadScore: 60 } } },
        { contactId: 'c2', expand: { contactId: { leadScore: 60 } } },
        { contactId: 'c3', expand: { contactId: { leadScore: 10 } } },
        { contactId: 'c4', expand: { contactId: { leadScore: 10 } } }
      ]

      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(mockLinks)
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getEngagementStats('edition-1')

      expect(result.engagementDistribution).toHaveLength(3)
      const hotDist = result.engagementDistribution.find((d) => d.level === 'hot')
      expect(hotDist?.percentage).toBe(50)
      const coldDist = result.engagementDistribution.find((d) => d.level === 'cold')
      expect(coldDist?.percentage).toBe(50)
    })

    it('should handle empty results gracefully', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getEngagementStats('edition-1')

      expect(result.hotLeadsCount).toBe(0)
      expect(result.warmLeadsCount).toBe(0)
      expect(result.coldLeadsCount).toBe(0)
      expect(result.averageEngagementScore).toBe(0)
      expect(result.engagementDistribution).toEqual([])
    })
  })
})
