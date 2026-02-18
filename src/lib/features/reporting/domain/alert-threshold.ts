import { z } from 'zod'

export const alertLevelSchema = z.enum(['info', 'warning', 'critical'])

export type AlertLevel = z.infer<typeof alertLevelSchema>

export const metricSourceSchema = z.enum([
  'cfp_submissions',
  'cfp_reviews',
  'cfp_acceptance_rate',
  'cfp_pending_reviews',
  'billing_sales',
  'billing_revenue',
  'billing_stock',
  'crm_contacts',
  'crm_engagement',
  'crm_campaigns',
  'budget_variance',
  'budget_cashflow',
  'budget_utilization',
  'planning_sessions',
  'planning_conflicts',
  'planning_occupancy',
  'sponsoring_revenue',
  'sponsoring_pipeline'
])

export type MetricSource = z.infer<typeof metricSourceSchema>

export const comparisonOperatorSchema = z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'neq'])

export type ComparisonOperator = z.infer<typeof comparisonOperatorSchema>

export const alertThresholdSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  metricSource: metricSourceSchema,
  operator: comparisonOperatorSchema,
  thresholdValue: z.number(),
  level: alertLevelSchema,
  enabled: z.boolean().default(true),
  notifyByEmail: z.boolean().default(false),
  notifyInApp: z.boolean().default(true),
  emailRecipients: z.array(z.string().email()).default([]),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AlertThreshold = z.infer<typeof alertThresholdSchema>

export const createAlertThresholdSchema = alertThresholdSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateAlertThreshold = z.infer<typeof createAlertThresholdSchema>

export const updateAlertThresholdSchema = createAlertThresholdSchema.partial()

export type UpdateAlertThreshold = z.infer<typeof updateAlertThresholdSchema>

export const getAlertLevelLabel = (level: AlertLevel): string => {
  const labels: Record<AlertLevel, string> = {
    info: 'Information',
    warning: 'Warning',
    critical: 'Critical'
  }
  return labels[level]
}

export const getAlertLevelColor = (level: AlertLevel): string => {
  const colors: Record<AlertLevel, string> = {
    info: 'blue',
    warning: 'yellow',
    critical: 'red'
  }
  return colors[level]
}

export const getMetricSourceLabel = (source: MetricSource): string => {
  const labels: Record<MetricSource, string> = {
    cfp_submissions: 'CFP - Submissions',
    cfp_reviews: 'CFP - Reviews',
    cfp_acceptance_rate: 'CFP - Acceptance Rate',
    cfp_pending_reviews: 'CFP - Pending Reviews',
    billing_sales: 'Billing - Sales',
    billing_revenue: 'Billing - Revenue',
    billing_stock: 'Billing - Stock',
    crm_contacts: 'CRM - Contacts',
    crm_engagement: 'CRM - Engagement',
    crm_campaigns: 'CRM - Campaigns',
    budget_variance: 'Budget - Variance',
    budget_cashflow: 'Budget - Cash Flow',
    budget_utilization: 'Budget - Utilization',
    planning_sessions: 'Planning - Sessions',
    planning_conflicts: 'Planning - Conflicts',
    planning_occupancy: 'Planning - Occupancy',
    sponsoring_revenue: 'Sponsoring - Revenue',
    sponsoring_pipeline: 'Sponsoring - Pipeline'
  }
  return labels[source]
}

export const getComparisonOperatorLabel = (operator: ComparisonOperator): string => {
  const labels: Record<ComparisonOperator, string> = {
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    eq: 'Equal to',
    neq: 'Not equal to'
  }
  return labels[operator]
}

export const getComparisonOperatorSymbol = (operator: ComparisonOperator): string => {
  const symbols: Record<ComparisonOperator, string> = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '=',
    neq: '!='
  }
  return symbols[operator]
}

export const evaluateThreshold = (
  currentValue: number,
  operator: ComparisonOperator,
  thresholdValue: number
): boolean => {
  switch (operator) {
    case 'gt':
      return currentValue > thresholdValue
    case 'gte':
      return currentValue >= thresholdValue
    case 'lt':
      return currentValue < thresholdValue
    case 'lte':
      return currentValue <= thresholdValue
    case 'eq':
      return currentValue === thresholdValue
    case 'neq':
      return currentValue !== thresholdValue
  }
}
