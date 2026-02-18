import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProfitabilityService } from './profitability-service'

describe('ProfitabilityService', () => {
  describe('calculateBreakEven', () => {
    let mockPb: PocketBase

    beforeEach(() => {
      mockPb = {} as PocketBase
    })

    const service = createProfitabilityService({} as PocketBase)

    it('should calculate basic break-even point', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 10000,
        variableCostPerAttendee: 20,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      // Contribution margin: 100 - 20 = 80
      // Break-even: ceil(10000 / 80) = 125
      expect(result.breakEvenAttendees).toBe(125)
      expect(result.breakEvenRevenue).toBe(12500) // 125 * 100
      expect(result.contributionMargin).toBe(80)
    })

    it('should account for sponsorship revenue', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 10000,
        variableCostPerAttendee: 20,
        ticketPrice: 100,
        sponsorshipRevenue: 5000
      })

      // Costs to recover: 10000 - 5000 = 5000
      // Break-even: ceil(5000 / 80) = 63
      expect(result.breakEvenAttendees).toBe(63)
    })

    it('should handle sponsorship covering all fixed costs', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 5000,
        variableCostPerAttendee: 20,
        ticketPrice: 100,
        sponsorshipRevenue: 10000
      })

      // Costs to recover: max(0, 5000 - 10000) = 0
      // Break-even: ceil(0 / 80) = 0
      expect(result.breakEvenAttendees).toBe(0)
    })

    it('should return infinity when contribution margin is zero', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 10000,
        variableCostPerAttendee: 100,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      // Contribution margin: 100 - 100 = 0
      expect(result.breakEvenAttendees).toBe(Number.POSITIVE_INFINITY)
      expect(result.breakEvenRevenue).toBe(Number.POSITIVE_INFINITY)
      expect(result.safetyMargin).toBe(-100)
    })

    it('should return infinity when contribution margin is negative', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 10000,
        variableCostPerAttendee: 150,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      // Contribution margin: 100 - 150 = -50 (negative)
      expect(result.breakEvenAttendees).toBe(Number.POSITIVE_INFINITY)
      expect(result.contributionMargin).toBe(0)
    })

    it('should calculate safety margin correctly', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 10000,
        variableCostPerAttendee: 25,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      // Contribution margin: 100 - 25 = 75
      // Safety margin: (75 / 100) * 100 = 75%
      expect(result.safetyMargin).toBe(75)
      expect(result.contributionMargin).toBe(75)
    })

    it('should handle zero fixed costs', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 0,
        variableCostPerAttendee: 20,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      expect(result.breakEvenAttendees).toBe(0)
      expect(result.breakEvenRevenue).toBe(0)
    })

    it('should handle all zero inputs', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 0,
        variableCostPerAttendee: 0,
        ticketPrice: 0,
        sponsorshipRevenue: 0
      })

      // Contribution margin is 0, so infinity
      expect(result.breakEvenAttendees).toBe(Number.POSITIVE_INFINITY)
    })

    it('should round break-even attendees up', () => {
      const result = service.calculateBreakEven({
        fixedCosts: 1000,
        variableCostPerAttendee: 10,
        ticketPrice: 100,
        sponsorshipRevenue: 0
      })

      // Contribution margin: 100 - 10 = 90
      // Break-even: 1000 / 90 = 11.11... -> ceil to 12
      expect(result.breakEvenAttendees).toBe(12)
    })
  })

  describe('calculateProfitability', () => {
    it('should be defined', () => {
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([]),
          getList: vi.fn().mockResolvedValue({ totalItems: 0 }),
          getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found')),
          getOne: vi.fn().mockResolvedValue({})
        })
      } as unknown as PocketBase

      const service = createProfitabilityService(mockPb)
      expect(service.calculateProfitability).toBeDefined()
    })
  })
})
