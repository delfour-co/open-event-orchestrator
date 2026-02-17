import { z } from 'zod'

export const costItemSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().min(0)
})

export type CostItem = z.infer<typeof costItemSchema>

export const ticketTypeEstimateSchema = z.object({
  ticketTypeId: z.string(),
  name: z.string(),
  price: z.number().min(0),
  expectedQuantity: z.number().int().min(0)
})

export type TicketTypeEstimate = z.infer<typeof ticketTypeEstimateSchema>

export const simulationParametersSchema = z.object({
  // Legacy fields for backward compatibility and presets
  expectedAttendees: z.number().int().min(0).optional(),
  ticketPrice: z.number().min(0).optional(),
  // New ticket type-based estimates
  ticketEstimates: z.array(ticketTypeEstimateSchema).optional(),
  sponsorshipTarget: z.number().min(0), // Full amount in currency
  fixedCosts: z.array(costItemSchema).default([]),
  variableCostsPerAttendee: z.array(costItemSchema).default([])
})

export type SimulationParameters = z.infer<typeof simulationParametersSchema>

export const simulationResultsSchema = z.object({
  totalRevenue: z.number(),
  ticketRevenue: z.number(),
  sponsorshipRevenue: z.number(),
  totalCosts: z.number(),
  fixedCostsTotal: z.number(),
  variableCostsTotal: z.number(),
  netProfit: z.number(),
  profitMargin: z.number(),
  breakEvenAttendees: z.number().int(),
  breakEvenTicketPrice: z.number()
})

export type SimulationResults = z.infer<typeof simulationResultsSchema>

export const simulationScenarioSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  parameters: simulationParametersSchema,
  results: simulationResultsSchema.optional(),
  isBaseline: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SimulationScenario = z.infer<typeof simulationScenarioSchema>

export const createSimulationScenarioSchema = simulationScenarioSchema.omit({
  id: true,
  results: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSimulationScenario = z.infer<typeof createSimulationScenarioSchema>

export const updateSimulationScenarioSchema = createSimulationScenarioSchema.partial().omit({
  editionId: true,
  createdBy: true
})

export type UpdateSimulationScenario = z.infer<typeof updateSimulationScenarioSchema>

export const calculateSimulation = (params: SimulationParameters): SimulationResults => {
  // Calculate attendees and ticket revenue from ticket estimates or legacy fields
  let expectedAttendees: number
  let ticketRevenue: number
  let averageTicketPrice: number

  if (params.ticketEstimates && params.ticketEstimates.length > 0) {
    // New mode: calculate from ticket type estimates
    expectedAttendees = params.ticketEstimates.reduce((sum, t) => sum + t.expectedQuantity, 0)
    ticketRevenue = params.ticketEstimates.reduce((sum, t) => sum + t.price * t.expectedQuantity, 0)
    averageTicketPrice = expectedAttendees > 0 ? ticketRevenue / expectedAttendees : 0
  } else {
    // Legacy mode: use single attendees and price
    expectedAttendees = params.expectedAttendees || 0
    averageTicketPrice = params.ticketPrice || 0
    ticketRevenue = expectedAttendees * averageTicketPrice
  }

  const sponsorshipRevenue = params.sponsorshipTarget
  const totalRevenue = ticketRevenue + sponsorshipRevenue

  const fixedCostsTotal = params.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const variableCostPerAttendee = params.variableCostsPerAttendee.reduce(
    (sum, cost) => sum + cost.amount,
    0
  )
  const variableCostsTotal = expectedAttendees * variableCostPerAttendee
  const totalCosts = fixedCostsTotal + variableCostsTotal

  const netProfit = totalRevenue - totalCosts
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Break-even attendees: how many attendees needed to cover fixed costs after sponsorship
  // Formula: attendees × (ticketPrice - variableCost) = fixedCosts - sponsorship
  const netRevenuePerAttendee = averageTicketPrice - variableCostPerAttendee
  const fixedCostsAfterSponsorship = Math.max(0, fixedCostsTotal - sponsorshipRevenue)
  const breakEvenAttendees =
    netRevenuePerAttendee > 0
      ? Math.ceil(fixedCostsAfterSponsorship / netRevenuePerAttendee)
      : Number.POSITIVE_INFINITY

  // Break-even ticket price: given expected attendees, what price covers costs
  // Formula: ticketPrice = (fixedCosts - sponsorship) / attendees + variableCost
  const breakEvenTicketPrice =
    expectedAttendees > 0
      ? Math.ceil(fixedCostsAfterSponsorship / expectedAttendees + variableCostPerAttendee)
      : 0

  return {
    totalRevenue,
    ticketRevenue,
    sponsorshipRevenue,
    totalCosts,
    fixedCostsTotal,
    variableCostsTotal,
    netProfit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    breakEvenAttendees: Number.isFinite(breakEvenAttendees) ? breakEvenAttendees : 0,
    breakEvenTicketPrice: Math.max(0, breakEvenTicketPrice)
  }
}

export interface ScenarioComparison {
  scenarios: SimulationScenario[]
  baseline: SimulationScenario | null
  differences: Array<{
    scenarioId: string
    scenarioName: string
    profitDifference: number
    marginDifference: number
    attendeesDifference: number
  }>
}

export const compareScenarios = (scenarios: SimulationScenario[]): ScenarioComparison => {
  const baseline = scenarios.find((s) => s.isBaseline) || scenarios[0] || null

  const differences = scenarios
    .filter((s) => s.results && baseline?.results)
    .map((scenario) => ({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      profitDifference: (scenario.results?.netProfit || 0) - (baseline?.results?.netProfit || 0),
      marginDifference:
        (scenario.results?.profitMargin || 0) - (baseline?.results?.profitMargin || 0),
      attendeesDifference:
        (scenario.parameters.expectedAttendees || 0) - (baseline?.parameters.expectedAttendees || 0)
    }))

  return { scenarios, baseline, differences }
}

export interface SimulationPreset extends SimulationParameters {
  name: string
}

export const DEFAULT_SIMULATION_PRESETS: SimulationPreset[] = [
  {
    name: 'Small Conference (100 attendees)',
    expectedAttendees: 100,
    ticketPrice: 50,
    sponsorshipTarget: 5000,
    fixedCosts: [
      { name: 'Venue', amount: 2000 },
      { name: 'A/V Equipment', amount: 500 },
      { name: 'Marketing', amount: 300 },
      { name: 'Speaker travel', amount: 1500 },
      { name: 'Insurance', amount: 200 }
    ],
    variableCostsPerAttendee: [
      { name: 'Catering', amount: 30 },
      { name: 'Badge & swag', amount: 5 }
    ]
  },
  {
    name: 'Medium Conference (300 attendees)',
    expectedAttendees: 300,
    ticketPrice: 80,
    sponsorshipTarget: 20000,
    fixedCosts: [
      { name: 'Venue', amount: 8000 },
      { name: 'A/V Equipment', amount: 3000 },
      { name: 'Marketing', amount: 1500 },
      { name: 'Speaker travel', amount: 5000 },
      { name: 'Speaker accommodation', amount: 3000 },
      { name: 'Insurance', amount: 500 }
    ],
    variableCostsPerAttendee: [
      { name: 'Catering', amount: 35 },
      { name: 'Badge & swag', amount: 10 }
    ]
  },
  {
    name: 'Large Conference (800 attendees)',
    expectedAttendees: 800,
    ticketPrice: 120,
    sponsorshipTarget: 80000,
    fixedCosts: [
      { name: 'Venue', amount: 30000 },
      { name: 'A/V Production', amount: 12000 },
      { name: 'Marketing', amount: 8000 },
      { name: 'Speaker travel', amount: 15000 },
      { name: 'Speaker accommodation', amount: 10000 },
      { name: 'Photography', amount: 3000 },
      { name: 'Party/Social event', amount: 8000 },
      { name: 'Insurance', amount: 1500 },
      { name: 'Security', amount: 2000 }
    ],
    variableCostsPerAttendee: [
      { name: 'Catering', amount: 40 },
      { name: 'Badge & swag', amount: 15 }
    ]
  }
]
