import type { SimulationParameters, SimulationResults, SimulationScenario } from '../domain'
import { type ScenarioComparison, calculateSimulation, compareScenarios } from '../domain'

export interface SimulationService {
  simulate(params: SimulationParameters): SimulationResults
  compareScenarios(scenarios: SimulationScenario[]): ScenarioComparison
  calculateSensitivity(
    baseParams: SimulationParameters,
    variable: 'attendees' | 'ticketPrice' | 'sponsorship',
    percentRange: number,
    steps: number
  ): SensitivityAnalysis
}

export interface SensitivityPoint {
  value: number
  percentChange: number
  profit: number
  margin: number
}

export interface SensitivityAnalysis {
  variable: string
  baseValue: number
  points: SensitivityPoint[]
}

export function createSimulationService(): SimulationService {
  return {
    simulate(params: SimulationParameters): SimulationResults {
      return calculateSimulation(params)
    },

    compareScenarios(scenarios: SimulationScenario[]): ScenarioComparison {
      return compareScenarios(scenarios)
    },

    calculateSensitivity(
      baseParams: SimulationParameters,
      variable: 'attendees' | 'ticketPrice' | 'sponsorship',
      percentRange = 50,
      steps = 10
    ): SensitivityAnalysis {
      const points: SensitivityPoint[] = []

      let baseValue: number
      switch (variable) {
        case 'attendees':
          baseValue = baseParams.expectedAttendees ?? 0
          break
        case 'ticketPrice':
          baseValue = baseParams.ticketPrice ?? 0
          break
        case 'sponsorship':
          baseValue = baseParams.sponsorshipTarget
          break
      }

      const stepSize = (percentRange * 2) / steps

      for (let i = 0; i <= steps; i++) {
        const percentChange = -percentRange + i * stepSize
        const multiplier = 1 + percentChange / 100
        const newValue = Math.round(baseValue * multiplier)

        let modifiedParams: SimulationParameters
        switch (variable) {
          case 'attendees':
            modifiedParams = { ...baseParams, expectedAttendees: newValue }
            break
          case 'ticketPrice':
            modifiedParams = { ...baseParams, ticketPrice: newValue }
            break
          case 'sponsorship':
            modifiedParams = { ...baseParams, sponsorshipTarget: newValue }
            break
        }

        const results = calculateSimulation(modifiedParams)

        points.push({
          value: newValue,
          percentChange,
          profit: results.netProfit,
          margin: results.profitMargin
        })
      }

      return {
        variable,
        baseValue,
        points
      }
    }
  }
}

export type { ScenarioComparison } from '../domain'
