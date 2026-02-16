import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDashboardMetricsService } from './dashboard-metrics-service'

const createMockPb = () => {
  const mockCollections: Record<string, unknown[]> = {
    editions: [{ id: 'edition-1', eventId: 'event-1' }],
    ticket_types: [
      { id: 'tt-1', editionId: 'edition-1', quantity: 100, quantitySold: 25 },
      { id: 'tt-2', editionId: 'edition-1', quantity: 50, quantitySold: 10 }
    ],
    orders: [
      { id: 'order-1', editionId: 'edition-1', status: 'paid', totalAmount: 5000 },
      { id: 'order-2', editionId: 'edition-1', status: 'paid', totalAmount: 3000 },
      { id: 'order-3', editionId: 'edition-1', status: 'pending', totalAmount: 2000 }
    ],
    billing_tickets: [
      { id: 'ticket-1', editionId: 'edition-1', status: 'valid', price: 2500 },
      { id: 'ticket-2', editionId: 'edition-1', status: 'used', price: 2500 },
      { id: 'ticket-3', editionId: 'edition-1', status: 'cancelled', price: 2500 }
    ],
    talks: [
      { id: 'talk-1', editionId: 'edition-1', status: 'accepted', speakerId: 'speaker-1' },
      { id: 'talk-2', editionId: 'edition-1', status: 'submitted', speakerId: 'speaker-2' },
      { id: 'talk-3', editionId: 'edition-1', status: 'rejected', speakerId: 'speaker-1' }
    ],
    sessions: [
      { id: 'session-1', editionId: 'edition-1', slotId: 'slot-1', trackId: 'track-1' },
      { id: 'session-2', editionId: 'edition-1', slotId: null, trackId: 'track-1' }
    ],
    tracks: [{ id: 'track-1', editionId: 'edition-1', name: 'Main Track' }],
    rooms: [{ id: 'room-1', editionId: 'edition-1', name: 'Room A' }],
    contacts: [
      { id: 'contact-1', eventId: 'event-1' },
      { id: 'contact-2', eventId: 'event-1' }
    ],
    edition_sponsors: [
      { id: 'sponsor-1', editionId: 'edition-1', status: 'confirmed', amount: 10000 },
      { id: 'sponsor-2', editionId: 'edition-1', status: 'pending', amount: 5000 }
    ],
    edition_budgets: [{ id: 'budget-1', editionId: 'edition-1', totalBudget: 50000, spent: 15000 }]
  }

  return {
    collection: vi.fn((name: string) => ({
      getOne: vi.fn(async (id: string) => {
        const items = mockCollections[name] || []
        const item = (items as Array<Record<string, unknown>>).find((i) => i.id === id)
        if (!item) throw new Error('Not found')
        return item
      }),
      getFullList: vi.fn(async () => mockCollections[name] || []),
      getList: vi.fn(async () => ({
        items: mockCollections[name] || []
      }))
    }))
  }
}

describe('createDashboardMetricsService', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('getEditionMetrics', () => {
    it('should return correct billing metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.billing.totalRevenue).toBe(8000) // 5000 + 3000 (paid orders only)
      expect(metrics.billing.paidOrdersCount).toBe(2)
      expect(metrics.billing.ordersCount).toBe(3)
      expect(metrics.billing.ticketsSold).toBe(2) // 2 non-cancelled tickets
      expect(metrics.billing.ticketsCheckedIn).toBe(1) // 1 used ticket
      expect(metrics.billing.ticketsAvailable).toBe(115) // (100-25) + (50-10)
    })

    it('should return correct CFP metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.cfp.totalSubmissions).toBe(3)
      expect(metrics.cfp.acceptedTalks).toBe(1)
      expect(metrics.cfp.rejectedTalks).toBe(1)
      expect(metrics.cfp.pendingReviews).toBe(1)
      expect(metrics.cfp.speakersCount).toBe(2) // 2 unique speakers
    })

    it('should return correct planning metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.planning.totalSessions).toBe(2)
      expect(metrics.planning.scheduledSessions).toBe(1)
      expect(metrics.planning.unscheduledSessions).toBe(1)
      expect(metrics.planning.tracksCount).toBe(1)
      expect(metrics.planning.roomsCount).toBe(1)
    })

    it('should return correct sponsoring metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.sponsoring.totalSponsors).toBe(2)
      expect(metrics.sponsoring.confirmedSponsors).toBe(1)
      expect(metrics.sponsoring.pendingSponsors).toBe(1)
      expect(metrics.sponsoring.totalSponsorshipValue).toBe(10000) // Only confirmed sponsors
    })

    it('should return correct budget metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.budget.totalBudget).toBe(50000)
      expect(metrics.budget.spent).toBe(15000)
      expect(metrics.budget.remaining).toBe(35000)
    })

    it('should return correct CRM metrics', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.crm.totalContacts).toBe(2)
    })

    it('should calculate check-in rate correctly', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      // 1 checked in out of 2 sold = 50%
      expect(metrics.billing.checkInRate).toBe(50)
    })

    it('should handle empty collections gracefully', async () => {
      const emptyPb = {
        collection: vi.fn(() => ({
          getOne: vi.fn(async () => ({ id: 'edition-1', eventId: 'event-1' })),
          getFullList: vi.fn(async () => []),
          getList: vi.fn(async () => ({ items: [] }))
        }))
      }

      const service = createDashboardMetricsService(emptyPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.billing.totalRevenue).toBe(0)
      expect(metrics.billing.ticketsSold).toBe(0)
      expect(metrics.cfp.totalSubmissions).toBe(0)
      expect(metrics.planning.totalSessions).toBe(0)
      expect(metrics.sponsoring.totalSponsors).toBe(0)
    })

    it('should handle collection fetch errors gracefully', async () => {
      const errorPb = {
        collection: vi.fn((name: string) => ({
          getOne: vi.fn(async () => {
            if (name === 'editions') {
              return { id: 'edition-1', eventId: 'event-1' }
            }
            throw new Error('Not found')
          }),
          getFullList: vi.fn(async () => {
            throw new Error('Collection error')
          }),
          getList: vi.fn(async () => {
            throw new Error('Collection error')
          })
        }))
      }

      const service = createDashboardMetricsService(errorPb as never)
      const metrics = await service.getEditionMetrics('edition-1')

      expect(metrics.billing.totalRevenue).toBe(0)
      expect(metrics.cfp.totalSubmissions).toBe(0)
    })

    it('should include lastUpdated timestamp', async () => {
      const service = createDashboardMetricsService(mockPb as never)
      const before = new Date()
      const metrics = await service.getEditionMetrics('edition-1')
      const after = new Date()

      expect(metrics.lastUpdated).toBeDefined()
      expect(metrics.lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(metrics.lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
