import type { CreateAlert } from '../domain/alert'
import {
  type AlertThreshold,
  type MetricSource,
  evaluateThreshold,
  getComparisonOperatorSymbol
} from '../domain/alert-threshold'
import type { EditionMetrics } from '../domain/metrics'

export type MetricValue = {
  value: number
  unit?: string
}

export type ThresholdEvaluationResult = {
  threshold: AlertThreshold
  triggered: boolean
  currentValue: number
  unit?: string
}

export type EvaluationContext = {
  editionId: string
  metrics: EditionMetrics
}

/**
 * Extract the current value for a given metric source from edition metrics
 */
export const getMetricValue = (metrics: EditionMetrics, source: MetricSource): MetricValue => {
  switch (source) {
    // CFP metrics
    case 'cfp_submissions':
      return { value: metrics.cfp.totalSubmissions }
    case 'cfp_reviews':
      return { value: metrics.cfp.pendingReviews }
    case 'cfp_acceptance_rate':
      if (metrics.cfp.totalSubmissions === 0) return { value: 0, unit: '%' }
      return {
        value: Math.round((metrics.cfp.acceptedTalks / metrics.cfp.totalSubmissions) * 100),
        unit: '%'
      }

    // Billing metrics
    case 'billing_sales':
      return { value: metrics.billing.ticketsSold }
    case 'billing_revenue':
      return { value: metrics.billing.totalRevenue, unit: metrics.billing.currency }
    case 'billing_stock':
      return { value: metrics.billing.ticketsAvailable }

    // CRM metrics
    case 'crm_contacts':
      return { value: metrics.crm.totalContacts }
    case 'crm_engagement':
      return { value: Math.round(metrics.crm.openRate * 100), unit: '%' }
    case 'crm_campaigns':
      return { value: metrics.crm.emailsSent }

    // Budget metrics
    case 'budget_variance': {
      if (metrics.budget.totalBudget === 0) return { value: 0, unit: '%' }
      const variance = Math.round(
        ((metrics.budget.spent - metrics.budget.totalBudget) / metrics.budget.totalBudget) * 100
      )
      return { value: variance, unit: '%' }
    }
    case 'budget_cashflow':
      return { value: metrics.budget.remaining, unit: metrics.budget.currency }

    // Planning metrics
    case 'planning_sessions':
      return { value: metrics.planning.scheduledSessions }
    case 'planning_conflicts':
      // Conflicts count would need to be added to metrics
      // For now, return unscheduled as a proxy
      return { value: metrics.planning.unscheduledSessions }
    case 'planning_occupancy':
      if (metrics.planning.slotsAvailable === 0) return { value: 0, unit: '%' }
      return {
        value: Math.round((metrics.planning.slotsUsed / metrics.planning.slotsAvailable) * 100),
        unit: '%'
      }

    // Sponsoring metrics
    case 'sponsoring_revenue':
      return {
        value: metrics.sponsoring.totalSponsorshipValue,
        unit: metrics.sponsoring.currency
      }
    case 'sponsoring_pipeline':
      return { value: metrics.sponsoring.pendingSponsors }

    default:
      return { value: 0 }
  }
}

/**
 * Evaluate a single threshold against current metrics
 */
export const evaluateSingleThreshold = (
  threshold: AlertThreshold,
  metrics: EditionMetrics
): ThresholdEvaluationResult => {
  const { value, unit } = getMetricValue(metrics, threshold.metricSource)
  const triggered = evaluateThreshold(value, threshold.operator, threshold.thresholdValue)

  return {
    threshold,
    triggered,
    currentValue: value,
    unit
  }
}

/**
 * Evaluate multiple thresholds against current metrics
 */
export const evaluateThresholds = (
  thresholds: AlertThreshold[],
  metrics: EditionMetrics
): ThresholdEvaluationResult[] => {
  return thresholds
    .filter((t) => t.enabled)
    .map((threshold) => evaluateSingleThreshold(threshold, metrics))
}

/**
 * Get only triggered thresholds
 */
export const getTriggeredThresholds = (
  thresholds: AlertThreshold[],
  metrics: EditionMetrics
): ThresholdEvaluationResult[] => {
  return evaluateThresholds(thresholds, metrics).filter((r) => r.triggered)
}

/**
 * Create an alert from a triggered threshold evaluation
 */
export const createAlertFromThreshold = (
  evaluation: ThresholdEvaluationResult,
  editionId: string
): CreateAlert => {
  const { threshold, currentValue } = evaluation
  const operatorSymbol = getComparisonOperatorSymbol(threshold.operator)

  const formattedCurrent = evaluation.unit
    ? `${currentValue}${evaluation.unit}`
    : currentValue.toString()
  const formattedThreshold = evaluation.unit
    ? `${threshold.thresholdValue}${evaluation.unit}`
    : threshold.thresholdValue.toString()

  return {
    editionId,
    thresholdId: threshold.id,
    title: threshold.name,
    message: `Current value (${formattedCurrent}) is ${operatorSymbol} threshold (${formattedThreshold})`,
    level: threshold.level,
    metricSource: threshold.metricSource,
    currentValue,
    thresholdValue: threshold.thresholdValue
  }
}

/**
 * Create the threshold evaluation service
 */
export const createThresholdEvaluationService = () => ({
  getMetricValue,
  evaluateSingleThreshold,
  evaluateThresholds,
  getTriggeredThresholds,
  createAlertFromThreshold
})

export type ThresholdEvaluationService = ReturnType<typeof createThresholdEvaluationService>
