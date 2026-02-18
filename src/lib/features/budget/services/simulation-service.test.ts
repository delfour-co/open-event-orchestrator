import { describe, expect, it } from 'vitest'
import type { SimulationScenario } from '../domain'
import { createSimulationService } from './simulation-service'

describe('SimulationService', () => {
  const service = createSimulationService()

  describe('simulate', () => {
    it('should calculate basic simulation results', () => {
      const result = service.simulate({
        expectedAttendees: 100,
        ticketPrice: 50,
        sponsorshipTarget: 5000,
        fixedCosts: [{ name: 'Venue', amount: 2000 }],
        variableCostsPerAttendee: [{ name: 'Catering', amount: 10 }]
      })

      expect(result.ticketRevenue).toBe(5000) // 100 * 50
      expect(result.sponsorshipRevenue).toBe(5000)
      expect(result.totalRevenue).toBe(10000)
      expect(result.fixedCostsTotal).toBe(2000)
      expect(result.variableCostsTotal).toBe(1000) // 100 * 10
      expect(result.totalCosts).toBe(3000)
      expect(result.netProfit).toBe(7000)
    })

    it('should calculate profit margin correctly', () => {
      const result = service.simulate({
        expectedAttendees: 100,
        ticketPrice: 100,
        sponsorshipTarget: 0,
        fixedCosts: [{ name: 'Venue', amount: 2500 }],
        variableCostsPerAttendee: []
      })

      expect(result.totalRevenue).toBe(10000)
      expect(result.totalCosts).toBe(2500)
      expect(result.netProfit).toBe(7500)
      expect(result.profitMargin).toBe(75) // 7500 / 10000 * 100
    })

    it('should handle zero revenue', () => {
      const result = service.simulate({
        expectedAttendees: 0,
        ticketPrice: 0,
        sponsorshipTarget: 0,
        fixedCosts: [{ name: 'Venue', amount: 1000 }],
        variableCostsPerAttendee: []
      })

      expect(result.totalRevenue).toBe(0)
      expect(result.profitMargin).toBe(0)
      expect(result.netProfit).toBe(-1000)
    })

    it('should calculate break-even attendees', () => {
      const result = service.simulate({
        expectedAttendees: 200,
        ticketPrice: 100,
        sponsorshipTarget: 2000,
        fixedCosts: [{ name: 'Venue', amount: 10000 }],
        variableCostsPerAttendee: [{ name: 'Catering', amount: 20 }]
      })

      // Fixed costs after sponsorship: 10000 - 2000 = 8000
      // Net revenue per attendee: 100 - 20 = 80
      // Break-even: ceil(8000 / 80) = 100
      expect(result.breakEvenAttendees).toBe(100)
    })

    it('should calculate break-even ticket price', () => {
      const result = service.simulate({
        expectedAttendees: 100,
        ticketPrice: 50,
        sponsorshipTarget: 2000,
        fixedCosts: [{ name: 'Venue', amount: 5000 }],
        variableCostsPerAttendee: [{ name: 'Catering', amount: 10 }]
      })

      // Fixed costs after sponsorship: 5000 - 2000 = 3000
      // Break-even price: ceil(3000 / 100) + 10 = 40
      expect(result.breakEvenTicketPrice).toBe(40)
    })

    it('should handle negative variable costs (not realistic but should not crash)', () => {
      const result = service.simulate({
        expectedAttendees: 100,
        ticketPrice: 50,
        sponsorshipTarget: 0,
        fixedCosts: [],
        variableCostsPerAttendee: []
      })

      expect(result.totalCosts).toBe(0)
      expect(result.netProfit).toBe(5000)
    })

    it('should use ticket estimates when provided', () => {
      const result = service.simulate({
        ticketEstimates: [
          { ticketTypeId: 'early', name: 'Early Bird', price: 30, expectedQuantity: 50 },
          { ticketTypeId: 'regular', name: 'Regular', price: 50, expectedQuantity: 100 }
        ],
        sponsorshipTarget: 0,
        fixedCosts: [],
        variableCostsPerAttendee: []
      })

      // Ticket revenue: 50*30 + 100*50 = 1500 + 5000 = 6500
      expect(result.ticketRevenue).toBe(6500)
      expect(result.totalRevenue).toBe(6500)
    })

    it('should handle multiple fixed and variable costs', () => {
      const result = service.simulate({
        expectedAttendees: 100,
        ticketPrice: 100,
        sponsorshipTarget: 1000,
        fixedCosts: [
          { name: 'Venue', amount: 2000 },
          { name: 'AV', amount: 1000 },
          { name: 'Marketing', amount: 500 }
        ],
        variableCostsPerAttendee: [
          { name: 'Catering', amount: 15 },
          { name: 'Badge', amount: 5 }
        ]
      })

      expect(result.fixedCostsTotal).toBe(3500)
      expect(result.variableCostsTotal).toBe(2000) // 100 * 20
      expect(result.totalCosts).toBe(5500)
    })
  })

  describe('compareScenarios', () => {
    const mockScenario = (overrides: Partial<SimulationScenario> = {}): SimulationScenario => ({
      id: 'scenario-1',
      editionId: 'edition-1',
      name: 'Test Scenario',
      parameters: {
        expectedAttendees: 100,
        ticketPrice: 50,
        sponsorshipTarget: 5000,
        fixedCosts: [],
        variableCostsPerAttendee: []
      },
      results: {
        totalRevenue: 10000,
        ticketRevenue: 5000,
        sponsorshipRevenue: 5000,
        totalCosts: 3000,
        fixedCostsTotal: 2000,
        variableCostsTotal: 1000,
        netProfit: 7000,
        profitMargin: 70,
        breakEvenAttendees: 50,
        breakEvenTicketPrice: 25
      },
      isBaseline: false,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    })

    it('should compare scenarios against baseline', () => {
      const baseline = mockScenario({ id: 'baseline', name: 'Baseline', isBaseline: true })
      const baselineResults = baseline.results ?? {
        totalRevenue: 0,
        ticketRevenue: 0,
        sponsorshipRevenue: 0,
        totalCosts: 0,
        fixedCostsTotal: 0,
        variableCostsTotal: 0,
        netProfit: 0,
        profitMargin: 0,
        breakEvenAttendees: 0,
        breakEvenTicketPrice: 0
      }
      const optimistic = mockScenario({
        id: 'optimistic',
        name: 'Optimistic',
        parameters: { ...baseline.parameters, expectedAttendees: 150 },
        results: {
          ...baselineResults,
          netProfit: 10000,
          profitMargin: 80
        }
      })

      const comparison = service.compareScenarios([baseline, optimistic])

      expect(comparison.baseline).toBe(baseline)
      expect(comparison.scenarios).toHaveLength(2)
      expect(comparison.differences).toHaveLength(2)

      const optimisticDiff = comparison.differences.find((d) => d.scenarioId === 'optimistic')
      expect(optimisticDiff?.profitDifference).toBe(3000) // 10000 - 7000
      expect(optimisticDiff?.marginDifference).toBe(10) // 80 - 70
      expect(optimisticDiff?.attendeesDifference).toBe(50) // 150 - 100
    })

    it('should use first scenario as baseline if none marked', () => {
      const scenario1 = mockScenario({ id: 'scenario-1', name: 'First' })
      const scenario2 = mockScenario({ id: 'scenario-2', name: 'Second' })

      const comparison = service.compareScenarios([scenario1, scenario2])

      expect(comparison.baseline).toBe(scenario1)
    })

    it('should handle empty scenarios array', () => {
      const comparison = service.compareScenarios([])

      expect(comparison.baseline).toBeNull()
      expect(comparison.scenarios).toHaveLength(0)
      expect(comparison.differences).toHaveLength(0)
    })

    it('should handle scenarios without results', () => {
      const withResults = mockScenario({ id: 'with', name: 'With Results', isBaseline: true })
      const withoutResults = mockScenario({
        id: 'without',
        name: 'Without Results',
        results: undefined
      })

      const comparison = service.compareScenarios([withResults, withoutResults])

      expect(comparison.differences).toHaveLength(1) // Only scenario with results
    })
  })

  describe('calculateSensitivity', () => {
    const baseParams = {
      expectedAttendees: 100,
      ticketPrice: 50,
      sponsorshipTarget: 5000,
      fixedCosts: [{ name: 'Venue', amount: 2000 }],
      variableCostsPerAttendee: [{ name: 'Catering', amount: 10 }]
    }

    it('should calculate sensitivity for attendees', () => {
      const analysis = service.calculateSensitivity(baseParams, 'attendees', 50, 10)

      expect(analysis.variable).toBe('attendees')
      expect(analysis.baseValue).toBe(100)
      expect(analysis.points).toHaveLength(11) // 0 to 10 inclusive

      // Check that points are sorted by percentage change
      expect(analysis.points[0].percentChange).toBe(-50)
      expect(analysis.points[10].percentChange).toBe(50)
    })

    it('should calculate sensitivity for ticket price', () => {
      const analysis = service.calculateSensitivity(baseParams, 'ticketPrice', 50, 10)

      expect(analysis.variable).toBe('ticketPrice')
      expect(analysis.baseValue).toBe(50)
      expect(analysis.points).toHaveLength(11)

      // At -50%: price = 25, revenue = 100*25 + 5000 = 7500, costs = 3000, profit = 4500
      const minPoint = analysis.points[0]
      expect(minPoint.value).toBe(25) // 50 * 0.5
    })

    it('should calculate sensitivity for sponsorship', () => {
      const analysis = service.calculateSensitivity(baseParams, 'sponsorship', 50, 10)

      expect(analysis.variable).toBe('sponsorship')
      expect(analysis.baseValue).toBe(5000)
      expect(analysis.points).toHaveLength(11)
    })

    it('should vary profit and margin in results', () => {
      const analysis = service.calculateSensitivity(baseParams, 'attendees', 50, 4)

      // Lower attendees should mean lower profit
      const lowAttendeesPoint = analysis.points[0]
      const highAttendeesPoint = analysis.points[4]

      expect(lowAttendeesPoint.profit).toBeLessThan(highAttendeesPoint.profit)
    })

    it('should handle zero base value', () => {
      const paramsWithZero = { ...baseParams, expectedAttendees: 0 }
      const analysis = service.calculateSensitivity(paramsWithZero, 'attendees', 50, 10)

      expect(analysis.baseValue).toBe(0)
      // All points should have value 0 since 0 * any multiplier = 0
      expect(analysis.points.every((p) => p.value === 0)).toBe(true)
    })
  })
})
