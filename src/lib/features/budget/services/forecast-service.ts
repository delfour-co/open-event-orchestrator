import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'

export interface ForecastMetrics {
  // Current state
  currentRevenue: number
  currentCosts: number

  // Forecasted values
  forecastedRevenue: number
  forecastedCosts: number
  forecastedProfit: number

  // Progress
  revenueProgress: number
  costProgress: number
  daysRemaining: number
  eventDate: Date | null

  // Projections based on current trends
  projectedFinalRevenue: number
  projectedFinalCosts: number
  projectedFinalProfit: number

  // Status
  isOnTrack: boolean
  riskLevel: 'low' | 'medium' | 'high'
  alerts: ForecastAlert[]
}

export interface ForecastAlert {
  type: 'warning' | 'danger' | 'info'
  message: string
  metric: string
  currentValue: number
  targetValue: number
}

export interface ForecastService {
  getForecast(editionId: string): Promise<ForecastMetrics>
  projectRevenue(currentRevenue: number, daysElapsed: number, totalDays: number): number
  projectCosts(currentCosts: number, daysElapsed: number, totalDays: number): number
}

interface TimeProgress {
  totalDays: number
  daysElapsed: number
  daysRemaining: number
  timeProgress: number
  eventDate: Date | null
}

// Helper function to calculate time progress
function calculateTimeProgress(eventDate: Date | null, createdAt: Date): TimeProgress {
  const now = new Date()
  const totalDays = eventDate
    ? Math.max(1, Math.ceil((eventDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    : 90
  const daysElapsed = Math.max(
    1,
    Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  )
  const daysRemaining = eventDate
    ? Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    timeProgress: daysElapsed / totalDays,
    eventDate
  }
}

// Helper function to get current revenue
async function getCurrentRevenue(pb: PocketBase, editionId: string): Promise<number> {
  const orders = await pb.collection('orders').getFullList({
    filter: safeFilter`editionId = ${editionId} && status = "completed"`,
    fields: 'totalAmount'
  })
  const ticketRevenue = orders.reduce((sum, o) => sum + ((o.totalAmount as number) || 0), 0)

  const sponsors = await pb.collection('edition_sponsors').getFullList({
    filter: safeFilter`editionId = ${editionId} && status = "confirmed"`,
    fields: 'amount'
  })
  const sponsorRevenue = sponsors.reduce((sum, s) => sum + ((s.amount as number) || 0), 0)

  return ticketRevenue + sponsorRevenue
}

// Helper function to get budget and costs
async function getBudgetAndCosts(
  pb: PocketBase,
  editionId: string
): Promise<{ plannedBudget: number; currentCosts: number }> {
  let budget = null
  try {
    budget = await pb
      .collection('edition_budgets')
      .getFirstListItem(safeFilter`editionId = ${editionId}`)
  } catch {
    // No budget found
  }

  const plannedBudget = (budget?.plannedBudget as number) || 0
  const budgetId = budget?.id as string

  if (!budgetId) {
    return { plannedBudget, currentCosts: 0 }
  }

  const categories = await pb.collection('budget_categories').getFullList({
    filter: safeFilter`budgetId = ${budgetId}`,
    fields: 'id'
  })

  if (categories.length === 0) {
    return { plannedBudget, currentCosts: 0 }
  }

  const categoryIds = categories.map((c) => c.id as string)
  const categoryFilter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')

  const transactions = await pb.collection('budget_transactions').getFullList({
    filter: `(${categoryFilter}) && type = "expense" && (status = "paid" || status = "pending")`,
    fields: 'amount'
  })

  const currentCosts = transactions.reduce((sum, t) => sum + ((t.amount as number) || 0), 0)
  return { plannedBudget, currentCosts }
}

// Helper function to calculate projections
function calculateProjections(currentRevenue: number, currentCosts: number, timeProgress: number) {
  const projectedFinalRevenue =
    timeProgress > 0 ? Math.round(currentRevenue / timeProgress) : currentRevenue
  const projectedFinalCosts =
    timeProgress > 0 ? Math.round(currentCosts / timeProgress) : currentCosts
  const projectedFinalProfit = projectedFinalRevenue - projectedFinalCosts

  return { projectedFinalRevenue, projectedFinalCosts, projectedFinalProfit }
}

// Helper function to generate alerts
function generateAlerts(
  revenueProgress: number,
  costProgress: number,
  timeProgress: number,
  currentRevenue: number,
  currentCosts: number,
  forecastedRevenue: number,
  forecastedCosts: number,
  projectedFinalRevenue: number,
  projectedFinalCosts: number,
  projectedFinalProfit: number
): ForecastAlert[] {
  const alerts: ForecastAlert[] = []
  const expectedProgress = timeProgress * 100

  // Revenue behind schedule
  if (revenueProgress < expectedProgress - 20) {
    alerts.push({
      type: 'warning',
      message: `Revenue is ${Math.round(expectedProgress - revenueProgress)}% behind schedule`,
      metric: 'revenue',
      currentValue: currentRevenue,
      targetValue: Math.round(forecastedRevenue * timeProgress)
    })
  }

  // Costs ahead of schedule
  if (costProgress > expectedProgress + 20) {
    alerts.push({
      type: 'danger',
      message: `Costs are ${Math.round(costProgress - expectedProgress)}% ahead of schedule`,
      metric: 'costs',
      currentValue: currentCosts,
      targetValue: Math.round(forecastedCosts * timeProgress)
    })
  }

  // Budget overrun risk
  if (projectedFinalCosts > forecastedCosts * 1.1) {
    alerts.push({
      type: 'danger',
      message: 'Projected costs exceed budget by more than 10%',
      metric: 'budget',
      currentValue: projectedFinalCosts,
      targetValue: forecastedCosts
    })
  }

  // Profit margin alerts
  const projectedMargin =
    projectedFinalRevenue > 0 ? (projectedFinalProfit / projectedFinalRevenue) * 100 : 0

  if (projectedMargin < 0) {
    alerts.push({
      type: 'danger',
      message: 'Event is projected to operate at a loss',
      metric: 'profit',
      currentValue: projectedFinalProfit,
      targetValue: 0
    })
  } else if (projectedMargin < 10) {
    alerts.push({
      type: 'warning',
      message: `Projected profit margin is only ${Math.round(projectedMargin)}%`,
      metric: 'margin',
      currentValue: projectedMargin,
      targetValue: 15
    })
  }

  return alerts
}

// Helper function to determine risk level
function determineRiskLevel(alerts: ForecastAlert[]): 'low' | 'medium' | 'high' {
  const dangerAlerts = alerts.filter((a) => a.type === 'danger').length
  const warningAlerts = alerts.filter((a) => a.type === 'warning').length

  if (dangerAlerts > 0) return 'high'
  if (warningAlerts > 1) return 'medium'
  return 'low'
}

export function createForecastService(pb: PocketBase): ForecastService {
  return {
    async getForecast(editionId: string): Promise<ForecastMetrics> {
      // Get edition info
      const edition = await pb.collection('editions').getOne(editionId)
      const eventDate = edition.startDate ? new Date(edition.startDate as string) : null
      const createdAt = new Date(edition.created as string)

      // Calculate time progress
      const time = calculateTimeProgress(eventDate, createdAt)

      // Get current revenue and costs
      const currentRevenue = await getCurrentRevenue(pb, editionId)
      const { plannedBudget, currentCosts } = await getBudgetAndCosts(pb, editionId)

      // Calculate forecasts
      const forecastedRevenue = plannedBudget || currentRevenue
      const forecastedCosts = plannedBudget || currentCosts
      const forecastedProfit = forecastedRevenue - forecastedCosts

      // Calculate progress percentages
      const revenueProgress = forecastedRevenue > 0 ? (currentRevenue / forecastedRevenue) * 100 : 0
      const costProgress = forecastedCosts > 0 ? (currentCosts / forecastedCosts) * 100 : 0

      // Project final values
      const projections = calculateProjections(currentRevenue, currentCosts, time.timeProgress)

      // Generate alerts
      const alerts = generateAlerts(
        revenueProgress,
        costProgress,
        time.timeProgress,
        currentRevenue,
        currentCosts,
        forecastedRevenue,
        forecastedCosts,
        projections.projectedFinalRevenue,
        projections.projectedFinalCosts,
        projections.projectedFinalProfit
      )

      // Determine risk level
      const riskLevel = determineRiskLevel(alerts)
      const expectedRevenueProgress = time.timeProgress * 100
      const isOnTrack = riskLevel === 'low' && revenueProgress >= expectedRevenueProgress - 10

      return {
        currentRevenue,
        currentCosts,
        forecastedRevenue,
        forecastedCosts,
        forecastedProfit,
        revenueProgress: Math.round(revenueProgress * 100) / 100,
        costProgress: Math.round(costProgress * 100) / 100,
        daysRemaining: time.daysRemaining,
        eventDate: time.eventDate,
        ...projections,
        isOnTrack,
        riskLevel,
        alerts
      }
    },

    projectRevenue(currentRevenue: number, daysElapsed: number, totalDays: number): number {
      if (daysElapsed <= 0) return currentRevenue
      const dailyRate = currentRevenue / daysElapsed
      return Math.round(dailyRate * totalDays)
    },

    projectCosts(currentCosts: number, daysElapsed: number, totalDays: number): number {
      if (daysElapsed <= 0) return currentCosts
      const dailyRate = currentCosts / daysElapsed
      return Math.round(dailyRate * totalDays)
    }
  }
}
