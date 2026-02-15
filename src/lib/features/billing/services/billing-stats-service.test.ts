import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBillingStatsService } from './billing-stats-service'

const createMockPb = () => ({
  collection: vi.fn()
})

describe('billing-stats-service', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('getSalesStats', () => {
    it('should calculate sales statistics correctly', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { quantity: 100, quantitySold: 50 },
          { quantity: 50, quantitySold: 25 }
        ])
        .mockResolvedValueOnce([
          { status: 'paid', totalAmount: 5000 },
          { status: 'paid', totalAmount: 2500 },
          { status: 'pending', totalAmount: 1000 },
          { status: 'cancelled', totalAmount: 500 }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createBillingStatsService(mockPb as never)
      const stats = await service.getSalesStats('edition-1')

      expect(stats.totalSales).toBe(75)
      expect(stats.totalCapacity).toBe(150)
      expect(stats.totalRevenue).toBe(7500)
      expect(stats.soldPercentage).toBe(50)
      expect(stats.ordersByStatus.paid).toBe(2)
      expect(stats.ordersByStatus.pending).toBe(1)
      expect(stats.ordersByStatus.cancelled).toBe(1)
    })

    it('should handle empty data', async () => {
      const mockGetFullList = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createBillingStatsService(mockPb as never)
      const stats = await service.getSalesStats('edition-1')

      expect(stats.totalSales).toBe(0)
      expect(stats.totalCapacity).toBe(0)
      expect(stats.totalRevenue).toBe(0)
      expect(stats.soldPercentage).toBe(0)
    })
  })

  describe('getRevenueByTicketType', () => {
    it('should calculate revenue breakdown correctly', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: 'tt-1', name: 'Early Bird', price: 5000, quantitySold: 10 },
          { id: 'tt-2', name: 'Regular', price: 7500, quantitySold: 20 },
          { id: 'tt-3', name: 'VIP', price: 15000, quantitySold: 5 }
        ])
      })

      const service = createBillingStatsService(mockPb as never)
      const result = await service.getRevenueByTicketType('edition-1')

      expect(result).toHaveLength(3)

      expect(result[0].ticketTypeName).toBe('Regular')
      expect(result[0].revenue).toBe(150000)
      expect(result[0].quantitySold).toBe(20)

      expect(result[1].ticketTypeName).toBe('VIP')
      expect(result[1].revenue).toBe(75000)

      expect(result[2].ticketTypeName).toBe('Early Bird')
      expect(result[2].revenue).toBe(50000)
    })

    it('should calculate percentages correctly', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: 'tt-1', name: 'Type A', price: 1000, quantitySold: 50 },
          { id: 'tt-2', name: 'Type B', price: 1000, quantitySold: 50 }
        ])
      })

      const service = createBillingStatsService(mockPb as never)
      const result = await service.getRevenueByTicketType('edition-1')

      expect(result[0].percentage).toBe(50)
      expect(result[1].percentage).toBe(50)
    })

    it('should handle no sales', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi
          .fn()
          .mockResolvedValue([{ id: 'tt-1', name: 'Type A', price: 1000, quantitySold: 0 }])
      })

      const service = createBillingStatsService(mockPb as never)
      const result = await service.getRevenueByTicketType('edition-1')

      expect(result[0].revenue).toBe(0)
      expect(result[0].percentage).toBe(0)
    })
  })

  describe('getSalesTrend', () => {
    it('should generate daily sales data', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { id: 'order-1', paidAt: yesterday.toISOString(), totalAmount: 5000 },
          { id: 'order-2', paidAt: today.toISOString(), totalAmount: 7500 }
        ])
        .mockResolvedValueOnce([
          { orderId: 'order-1', created: yesterday.toISOString() },
          { orderId: 'order-1', created: yesterday.toISOString() },
          { orderId: 'order-2', created: today.toISOString() }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createBillingStatsService(mockPb as never)
      const result = await service.getSalesTrend('edition-1', 7)

      expect(result.totalDays).toBe(7)
      expect(result.dailySales).toHaveLength(7)
      expect(result.averageDailySales).toBeGreaterThan(0)
      expect(result.averageDailyRevenue).toBeGreaterThan(0)
    })

    it('should handle no orders', async () => {
      const mockGetFullList = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createBillingStatsService(mockPb as never)
      const result = await service.getSalesTrend('edition-1', 7)

      expect(result.totalDays).toBe(7)
      expect(result.dailySales).toHaveLength(7)
      expect(result.averageDailySales).toBe(0)
      expect(result.averageDailyRevenue).toBe(0)
    })
  })

  describe('getLowStockAlerts', () => {
    it('should return alerts for low stock items', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: 'tt-1', name: 'Almost Sold Out', quantity: 100, quantitySold: 95 },
          { id: 'tt-2', name: 'Plenty Left', quantity: 100, quantitySold: 20 },
          { id: 'tt-3', name: 'Critical', quantity: 50, quantitySold: 48 }
        ])
      })

      const service = createBillingStatsService(mockPb as never)
      const alerts = await service.getLowStockAlerts('edition-1')

      expect(alerts).toHaveLength(2)
      expect(alerts[0].ticketTypeName).toBe('Critical')
      expect(alerts[0].remaining).toBe(2)
      expect(alerts[1].ticketTypeName).toBe('Almost Sold Out')
      expect(alerts[1].remaining).toBe(5)
    })

    it('should use custom threshold', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: 'tt-1', name: 'Type A', quantity: 100, quantitySold: 75 },
          { id: 'tt-2', name: 'Type B', quantity: 100, quantitySold: 90 }
        ])
      })

      const service = createBillingStatsService(mockPb as never)
      const alerts = await service.getLowStockAlerts('edition-1', 25)

      expect(alerts).toHaveLength(2)
    })

    it('should return empty array when all stock is healthy', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi
          .fn()
          .mockResolvedValue([{ id: 'tt-1', name: 'Type A', quantity: 100, quantitySold: 20 }])
      })

      const service = createBillingStatsService(mockPb as never)
      const alerts = await service.getLowStockAlerts('edition-1')

      expect(alerts).toHaveLength(0)
    })

    it('should sort alerts by remaining stock ascending', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { id: 'tt-1', name: 'Five Left', quantity: 100, quantitySold: 95 },
          { id: 'tt-2', name: 'Two Left', quantity: 50, quantitySold: 48 },
          { id: 'tt-3', name: 'Eight Left', quantity: 100, quantitySold: 92 }
        ])
      })

      const service = createBillingStatsService(mockPb as never)
      const alerts = await service.getLowStockAlerts('edition-1')

      expect(alerts[0].remaining).toBe(2)
      expect(alerts[1].remaining).toBe(5)
      expect(alerts[2].remaining).toBe(8)
    })
  })
})
