import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SIMULATION_PRESETS,
  type SimulationParameters,
  type SimulationScenario,
  calculateSimulation,
  compareScenarios,
  createSimulationScenarioSchema,
  simulationParametersSchema,
  simulationResultsSchema,
  simulationScenarioSchema,
  updateSimulationScenarioSchema
} from './simulation-scenario'

describe('SimulationScenario', () => {
  const validParameters: SimulationParameters = {
    expectedAttendees: 200,
    ticketPrice: 15000,
    sponsorshipTarget: 2000000,
    fixedCosts: [
      { name: 'Venue', amount: 500000 },
      { name: 'AV Equipment', amount: 150000 }
    ],
    variableCostsPerAttendee: [
      { name: 'Catering', amount: 3000 },
      { name: 'Badge', amount: 500 }
    ]
  }

  const validScenario = {
    id: 'scenario123',
    editionId: 'edition123',
    name: 'Base scenario',
    description: 'Initial budget projection',
    parameters: validParameters,
    isBaseline: true,
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('simulationParametersSchema', () => {
    it('should validate valid parameters', () => {
      const result = simulationParametersSchema.safeParse(validParameters)
      expect(result.success).toBe(true)
    })

    it('should validate minimal parameters', () => {
      const minimal = {
        expectedAttendees: 100,
        ticketPrice: 10000,
        sponsorshipTarget: 0
      }
      const result = simulationParametersSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject negative attendees', () => {
      const result = simulationParametersSchema.safeParse({
        ...validParameters,
        expectedAttendees: -10
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative ticket price', () => {
      const result = simulationParametersSchema.safeParse({
        ...validParameters,
        ticketPrice: -100
      })
      expect(result.success).toBe(false)
    })
  })

  describe('simulationResultsSchema', () => {
    it('should validate valid results', () => {
      const results = {
        totalRevenue: 5000000,
        ticketRevenue: 3000000,
        sponsorshipRevenue: 2000000,
        totalCosts: 2000000,
        fixedCostsTotal: 1500000,
        variableCostsTotal: 500000,
        netProfit: 3000000,
        profitMargin: 60,
        breakEvenAttendees: 50,
        breakEvenTicketPrice: 10000
      }
      const result = simulationResultsSchema.safeParse(results)
      expect(result.success).toBe(true)
    })
  })

  describe('simulationScenarioSchema', () => {
    it('should validate a valid scenario', () => {
      const result = simulationScenarioSchema.safeParse(validScenario)
      expect(result.success).toBe(true)
    })

    it('should validate scenario without description', () => {
      const { description, ...withoutDesc } = validScenario
      const result = simulationScenarioSchema.safeParse(withoutDesc)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = simulationScenarioSchema.safeParse({ ...validScenario, name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('createSimulationScenarioSchema', () => {
    it('should validate create data', () => {
      const createData = {
        editionId: 'edition123',
        name: 'New Scenario',
        parameters: validParameters,
        isBaseline: false,
        createdBy: 'user123'
      }
      const result = createSimulationScenarioSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateSimulationScenarioSchema', () => {
    it('should validate partial update', () => {
      const updateData = {
        name: 'Updated Scenario',
        isBaseline: true
      }
      const result = updateSimulationScenarioSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow updating parameters', () => {
      const updateData = {
        parameters: {
          ...validParameters,
          expectedAttendees: 300
        }
      }
      const result = updateSimulationScenarioSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('calculateSimulation', () => {
    it('should calculate correct revenues', () => {
      const results = calculateSimulation(validParameters)

      expect(results.ticketRevenue).toBe(200 * 15000)
      expect(results.sponsorshipRevenue).toBe(2000000)
      expect(results.totalRevenue).toBe(200 * 15000 + 2000000)
    })

    it('should calculate correct costs', () => {
      const results = calculateSimulation(validParameters)

      expect(results.fixedCostsTotal).toBe(500000 + 150000)
      expect(results.variableCostsTotal).toBe(200 * (3000 + 500))
      expect(results.totalCosts).toBe(650000 + 200 * 3500)
    })

    it('should calculate correct profit and margin', () => {
      const results = calculateSimulation(validParameters)

      const expectedRevenue = 200 * 15000 + 2000000
      const expectedCosts = 650000 + 200 * 3500
      const expectedProfit = expectedRevenue - expectedCosts

      expect(results.netProfit).toBe(expectedProfit)
      expect(results.profitMargin).toBeCloseTo((expectedProfit / expectedRevenue) * 100, 1)
    })

    it('should calculate break-even attendees', () => {
      const results = calculateSimulation(validParameters)

      // Costs not covered by sponsorship: totalCosts - sponsorship
      // Revenue per attendee: ticketPrice - variableCostPerAttendee
      // Break-even = costsToRecover / revenuePerAttendee

      // When sponsorship covers costs, break-even can be 0
      expect(results.breakEvenAttendees).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(results.breakEvenAttendees)).toBe(true)
    })

    it('should calculate positive break-even when sponsorship does not cover costs', () => {
      const params = { ...validParameters, sponsorshipTarget: 0 }
      const results = calculateSimulation(params)

      expect(results.breakEvenAttendees).toBeGreaterThan(0)
    })

    it('should handle zero attendees', () => {
      const params = { ...validParameters, expectedAttendees: 0 }
      const results = calculateSimulation(params)

      expect(results.ticketRevenue).toBe(0)
      expect(results.variableCostsTotal).toBe(0)
    })

    it('should handle zero ticket price', () => {
      const params = { ...validParameters, ticketPrice: 0 }
      const results = calculateSimulation(params)

      expect(results.ticketRevenue).toBe(0)
      expect(results.breakEvenAttendees).toBe(0) // Can't break even with free tickets
    })

    it('should handle no sponsorship', () => {
      const params = { ...validParameters, sponsorshipTarget: 0 }
      const results = calculateSimulation(params)

      expect(results.sponsorshipRevenue).toBe(0)
      expect(results.totalRevenue).toBe(results.ticketRevenue)
    })

    it('should handle no costs', () => {
      const params = {
        ...validParameters,
        fixedCosts: [],
        variableCostsPerAttendee: []
      }
      const results = calculateSimulation(params)

      expect(results.totalCosts).toBe(0)
      expect(results.netProfit).toBe(results.totalRevenue)
      expect(results.profitMargin).toBe(100)
    })

    it('should handle loss scenario', () => {
      const params: SimulationParameters = {
        expectedAttendees: 10,
        ticketPrice: 1000,
        sponsorshipTarget: 0,
        fixedCosts: [{ name: 'Venue', amount: 100000 }],
        variableCostsPerAttendee: []
      }
      const results = calculateSimulation(params)

      expect(results.netProfit).toBeLessThan(0)
      expect(results.profitMargin).toBeLessThan(0)
    })
  })

  describe('compareScenarios', () => {
    const createScenario = (
      id: string,
      name: string,
      isBaseline: boolean,
      profit: number
    ): SimulationScenario => ({
      id,
      editionId: 'edition123',
      name,
      parameters: validParameters,
      results: {
        totalRevenue: profit + 1000000,
        ticketRevenue: profit + 500000,
        sponsorshipRevenue: 500000,
        totalCosts: 1000000,
        fixedCostsTotal: 800000,
        variableCostsTotal: 200000,
        netProfit: profit,
        profitMargin: profit > 0 ? (profit / (profit + 1000000)) * 100 : 0,
        breakEvenAttendees: 100,
        breakEvenTicketPrice: 10000
      },
      isBaseline,
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    it('should identify baseline scenario', () => {
      const scenarios = [
        createScenario('1', 'Pessimistic', false, 100000),
        createScenario('2', 'Base', true, 500000),
        createScenario('3', 'Optimistic', false, 1000000)
      ]

      const comparison = compareScenarios(scenarios)

      expect(comparison.baseline?.id).toBe('2')
      expect(comparison.baseline?.isBaseline).toBe(true)
    })

    it('should use first scenario as baseline if none marked', () => {
      const scenarios = [
        createScenario('1', 'First', false, 100000),
        createScenario('2', 'Second', false, 500000)
      ]

      const comparison = compareScenarios(scenarios)

      expect(comparison.baseline?.id).toBe('1')
    })

    it('should calculate differences from baseline', () => {
      const scenarios = [
        createScenario('1', 'Base', true, 500000),
        createScenario('2', 'Better', false, 800000)
      ]

      const comparison = compareScenarios(scenarios)
      const betterDiff = comparison.differences.find((d) => d.scenarioId === '2')

      expect(betterDiff?.profitDifference).toBe(300000)
    })

    it('should handle empty scenarios', () => {
      const comparison = compareScenarios([])

      expect(comparison.scenarios).toHaveLength(0)
      expect(comparison.baseline).toBe(null)
      expect(comparison.differences).toHaveLength(0)
    })

    it('should include all scenarios in comparison', () => {
      const scenarios = [
        createScenario('1', 'A', true, 100000),
        createScenario('2', 'B', false, 200000),
        createScenario('3', 'C', false, 300000)
      ]

      const comparison = compareScenarios(scenarios)

      expect(comparison.scenarios).toHaveLength(3)
      expect(comparison.differences).toHaveLength(3)
    })
  })

  describe('DEFAULT_SIMULATION_PRESETS', () => {
    it('should have at least 3 presets', () => {
      expect(DEFAULT_SIMULATION_PRESETS.length).toBeGreaterThanOrEqual(3)
    })

    it('should have valid parameters for all presets', () => {
      for (const preset of DEFAULT_SIMULATION_PRESETS) {
        const result = simulationParametersSchema.safeParse({
          expectedAttendees: preset.expectedAttendees,
          ticketPrice: preset.ticketPrice,
          sponsorshipTarget: preset.sponsorshipTarget,
          fixedCosts: preset.fixedCosts,
          variableCostsPerAttendee: preset.variableCostsPerAttendee
        })
        expect(result.success).toBe(true)
      }
    })

    it('should have names for all presets', () => {
      for (const preset of DEFAULT_SIMULATION_PRESETS) {
        expect(preset.name).toBeDefined()
        expect(preset.name.length).toBeGreaterThan(0)
      }
    })

    it('should have increasing attendee counts', () => {
      const attendees = DEFAULT_SIMULATION_PRESETS.map((p) => p.expectedAttendees ?? 0)
      for (let i = 1; i < attendees.length; i++) {
        expect(attendees[i]).toBeGreaterThan(attendees[i - 1])
      }
    })

    it('should produce positive profit for presets', () => {
      for (const preset of DEFAULT_SIMULATION_PRESETS) {
        const params: SimulationParameters = {
          expectedAttendees: preset.expectedAttendees,
          ticketPrice: preset.ticketPrice,
          sponsorshipTarget: preset.sponsorshipTarget,
          fixedCosts: preset.fixedCosts,
          variableCostsPerAttendee: preset.variableCostsPerAttendee
        }
        const results = calculateSimulation(params)
        expect(results.netProfit).toBeGreaterThan(0)
      }
    })
  })
})
