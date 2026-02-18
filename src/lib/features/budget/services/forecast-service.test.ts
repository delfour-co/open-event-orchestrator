import type PocketBase from 'pocketbase'
import { describe, expect, it, vi } from 'vitest'
import { createForecastService } from './forecast-service'

// Helper to create mock PocketBase for forecast tests
function createForecastMockPb(): PocketBase {
  return {
    collection: vi.fn().mockImplementation((name) => {
      const handlers: Record<string, unknown> = {
        editions: {
          getOne: vi.fn().mockResolvedValue({
            id: 'edition-1',
            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        },
        orders: {
          getFullList: vi.fn().mockResolvedValue([{ totalAmount: 5000 }])
        },
        edition_sponsors: {
          getFullList: vi.fn().mockResolvedValue([{ amount: 2000 }])
        },
        edition_budgets: {
          getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
        }
      }
      return handlers[name] || { getFullList: vi.fn().mockResolvedValue([]) }
    })
  } as unknown as PocketBase
}

describe('ForecastService', () => {
  describe('projectRevenue', () => {
    const mockPb = {} as PocketBase
    const service = createForecastService(mockPb)

    it('should project revenue based on daily rate', () => {
      // $10,000 in 10 days, projecting for 30 days
      const projected = service.projectRevenue(10000, 10, 30)
      expect(projected).toBe(30000) // $1000/day * 30 days
    })

    it('should handle zero days elapsed', () => {
      const projected = service.projectRevenue(5000, 0, 30)
      expect(projected).toBe(5000) // Returns current revenue
    })

    it('should handle negative days elapsed', () => {
      const projected = service.projectRevenue(5000, -5, 30)
      expect(projected).toBe(5000) // Returns current revenue
    })

    it('should round to nearest integer', () => {
      const projected = service.projectRevenue(1000, 3, 10)
      // 1000 / 3 = 333.33... * 10 = 3333.33... -> rounds to 3333
      expect(projected).toBe(3333)
    })

    it('should handle projection to fewer days', () => {
      const projected = service.projectRevenue(10000, 20, 10)
      expect(projected).toBe(5000) // $500/day * 10 days
    })

    it('should handle zero current revenue', () => {
      const projected = service.projectRevenue(0, 10, 30)
      expect(projected).toBe(0)
    })
  })

  describe('projectCosts', () => {
    const mockPb = {} as PocketBase
    const service = createForecastService(mockPb)

    it('should project costs based on daily rate', () => {
      // $5,000 in 10 days, projecting for 30 days
      const projected = service.projectCosts(5000, 10, 30)
      expect(projected).toBe(15000) // $500/day * 30 days
    })

    it('should handle zero days elapsed', () => {
      const projected = service.projectCosts(3000, 0, 30)
      expect(projected).toBe(3000) // Returns current costs
    })

    it('should handle negative days elapsed', () => {
      const projected = service.projectCosts(3000, -1, 30)
      expect(projected).toBe(3000) // Returns current costs
    })

    it('should round to nearest integer', () => {
      const projected = service.projectCosts(1000, 7, 21)
      // 1000 / 7 = 142.857... * 21 = 3000
      expect(projected).toBe(3000)
    })

    it('should handle projection to fewer days', () => {
      const projected = service.projectCosts(6000, 20, 10)
      expect(projected).toBe(3000) // $300/day * 10 days
    })

    it('should handle zero current costs', () => {
      const projected = service.projectCosts(0, 10, 30)
      expect(projected).toBe(0)
    })

    it('should handle equal days (no projection needed)', () => {
      const projected = service.projectCosts(5000, 30, 30)
      expect(projected).toBe(5000)
    })
  })

  describe('getForecast', () => {
    it('should be defined and return correct structure', async () => {
      const mockPb = createForecastMockPb()
      const service = createForecastService(mockPb)
      const forecast = await service.getForecast('edition-1')

      expect(forecast).toHaveProperty('currentRevenue')
      expect(forecast).toHaveProperty('currentCosts')
      expect(forecast).toHaveProperty('forecastedRevenue')
      expect(forecast).toHaveProperty('forecastedCosts')
      expect(forecast).toHaveProperty('forecastedProfit')
      expect(forecast).toHaveProperty('revenueProgress')
      expect(forecast).toHaveProperty('costProgress')
      expect(forecast).toHaveProperty('daysRemaining')
      expect(forecast).toHaveProperty('projectedFinalRevenue')
      expect(forecast).toHaveProperty('projectedFinalCosts')
      expect(forecast).toHaveProperty('projectedFinalProfit')
      expect(forecast).toHaveProperty('isOnTrack')
      expect(forecast).toHaveProperty('riskLevel')
      expect(forecast).toHaveProperty('alerts')

      expect(['low', 'medium', 'high']).toContain(forecast.riskLevel)
      expect(Array.isArray(forecast.alerts)).toBe(true)
    })
  })
})
