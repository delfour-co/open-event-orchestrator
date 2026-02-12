/**
 * Engagement Metrics Domain Entity
 *
 * Defines metrics, KPIs, and calculations for CRM dashboard analytics.
 */

import { z } from 'zod'

// Time period options for metrics
export const metricPeriodSchema = z.enum([
  'today',
  'yesterday',
  'last_7_days',
  'last_30_days',
  'last_90_days',
  'this_month',
  'last_month',
  'this_year',
  'all_time'
])
export type MetricPeriod = z.infer<typeof metricPeriodSchema>

// Contact growth trend direction
export const trendDirectionSchema = z.enum(['up', 'down', 'stable'])
export type TrendDirection = z.infer<typeof trendDirectionSchema>

// Dashboard KPI schema
export const dashboardKpiSchema = z.object({
  totalContacts: z.number().int().min(0),
  activeContacts: z.number().int().min(0),
  newContacts: z.number().int().min(0),
  engagementRate: z.number().min(0).max(100),
  growthRate: z.number(),
  contactsWithConsent: z.number().int().min(0),
  consentRate: z.number().min(0).max(100)
})
export type DashboardKpi = z.infer<typeof dashboardKpiSchema>

// Contact growth data point
export const contactGrowthPointSchema = z.object({
  date: z.date(),
  total: z.number().int().min(0),
  newContacts: z.number().int().min(0),
  removedContacts: z.number().int().min(0)
})
export type ContactGrowthPoint = z.infer<typeof contactGrowthPointSchema>

// Contact source distribution
export const sourceDistributionSchema = z.object({
  source: z.string(),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100)
})
export type SourceDistribution = z.infer<typeof sourceDistributionSchema>

// Email metrics schema
export const emailMetricsSchema = z.object({
  totalSent: z.number().int().min(0),
  totalDelivered: z.number().int().min(0),
  totalOpened: z.number().int().min(0),
  totalClicked: z.number().int().min(0),
  totalBounced: z.number().int().min(0),
  totalUnsubscribed: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(100),
  openRate: z.number().min(0).max(100),
  clickRate: z.number().min(0).max(100),
  bounceRate: z.number().min(0).max(100),
  unsubscribeRate: z.number().min(0).max(100),
  clickToOpenRate: z.number().min(0).max(100)
})
export type EmailMetrics = z.infer<typeof emailMetricsSchema>

// Segment metrics schema
export const segmentMetricsSchema = z.object({
  segmentId: z.string(),
  segmentName: z.string(),
  memberCount: z.number().int().min(0),
  previousCount: z.number().int().min(0),
  growthRate: z.number(),
  openRate: z.number().min(0).max(100),
  clickRate: z.number().min(0).max(100)
})
export type SegmentMetrics = z.infer<typeof segmentMetricsSchema>

// Contact health score
export const contactHealthSchema = z.object({
  validEmails: z.number().int().min(0),
  invalidEmails: z.number().int().min(0),
  validEmailRate: z.number().min(0).max(100),
  inactiveContacts: z.number().int().min(0),
  inactiveRate: z.number().min(0).max(100),
  withoutConsent: z.number().int().min(0),
  withoutConsentRate: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  recommendations: z.array(z.string())
})
export type ContactHealth = z.infer<typeof contactHealthSchema>

// Top engaged contact
export const topEngagedContactSchema = z.object({
  contactId: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  engagementScore: z.number().min(0),
  lastActivityAt: z.date().optional(),
  activityCount: z.number().int().min(0)
})
export type TopEngagedContact = z.infer<typeof topEngagedContactSchema>

// Campaign comparison data
export const campaignComparisonSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  sentAt: z.date(),
  recipientCount: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(100),
  openRate: z.number().min(0).max(100),
  clickRate: z.number().min(0).max(100),
  bounceRate: z.number().min(0).max(100)
})
export type CampaignComparison = z.infer<typeof campaignComparisonSchema>

// Link click heatmap data
export const linkClickDataSchema = z.object({
  url: z.string(),
  label: z.string().optional(),
  clickCount: z.number().int().min(0),
  uniqueClicks: z.number().int().min(0),
  clickRate: z.number().min(0).max(100)
})
export type LinkClickData = z.infer<typeof linkClickDataSchema>

// Full dashboard data
export interface DashboardData {
  kpis: DashboardKpi
  previousKpis?: DashboardKpi
  contactGrowth: ContactGrowthPoint[]
  sourceDistribution: SourceDistribution[]
  topEngagedContacts: TopEngagedContact[]
  emailMetrics: EmailMetrics
  previousEmailMetrics?: EmailMetrics
  segmentMetrics: SegmentMetrics[]
  contactHealth: ContactHealth
  period: MetricPeriod
  generatedAt: Date
}

// Period labels
export const PERIOD_LABELS: Record<MetricPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  last_90_days: 'Last 90 Days',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_year: 'This Year',
  all_time: 'All Time'
}

// Thresholds for health scoring
export const HEALTH_THRESHOLDS = {
  validEmailMinRate: 95,
  inactiveMaxRate: 20,
  consentMinRate: 90,
  goodEngagementRate: 20,
  excellentEngagementRate: 40
}

// Inactive days threshold
export const INACTIVE_DAYS_THRESHOLD = 90

/**
 * Calculate engagement rate from activity count and total
 */
export function calculateEngagementRate(activeCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return Math.round((activeCount / totalCount) * 1000) / 10
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * Determine trend direction from growth rate
 */
export function getTrendDirection(growthRate: number): TrendDirection {
  if (growthRate > 1) return 'up'
  if (growthRate < -1) return 'down'
  return 'stable'
}

/**
 * Calculate email delivery rate
 */
export function calculateDeliveryRate(delivered: number, sent: number): number {
  if (sent === 0) return 0
  return Math.round((delivered / sent) * 1000) / 10
}

/**
 * Calculate email open rate
 */
export function calculateOpenRate(opened: number, delivered: number): number {
  if (delivered === 0) return 0
  return Math.round((opened / delivered) * 1000) / 10
}

/**
 * Calculate email click rate
 */
export function calculateClickRate(clicked: number, delivered: number): number {
  if (delivered === 0) return 0
  return Math.round((clicked / delivered) * 1000) / 10
}

/**
 * Calculate click-to-open rate
 */
export function calculateClickToOpenRate(clicked: number, opened: number): number {
  if (opened === 0) return 0
  return Math.round((clicked / opened) * 1000) / 10
}

/**
 * Calculate bounce rate
 */
export function calculateBounceRate(bounced: number, sent: number): number {
  if (sent === 0) return 0
  return Math.round((bounced / sent) * 1000) / 10
}

/**
 * Calculate unsubscribe rate
 */
export function calculateUnsubscribeRate(unsubscribed: number, delivered: number): number {
  if (delivered === 0) return 0
  return Math.round((unsubscribed / delivered) * 1000) / 10
}

/**
 * Build email metrics from raw counts
 */
export function buildEmailMetrics(stats: {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
}): EmailMetrics {
  return {
    totalSent: stats.sent,
    totalDelivered: stats.delivered,
    totalOpened: stats.opened,
    totalClicked: stats.clicked,
    totalBounced: stats.bounced,
    totalUnsubscribed: stats.unsubscribed,
    deliveryRate: calculateDeliveryRate(stats.delivered, stats.sent),
    openRate: calculateOpenRate(stats.opened, stats.delivered),
    clickRate: calculateClickRate(stats.clicked, stats.delivered),
    bounceRate: calculateBounceRate(stats.bounced, stats.sent),
    unsubscribeRate: calculateUnsubscribeRate(stats.unsubscribed, stats.delivered),
    clickToOpenRate: calculateClickToOpenRate(stats.clicked, stats.opened)
  }
}

/**
 * Calculate contact health score (0-100)
 */
export function calculateHealthScore(
  validEmailRate: number,
  inactiveRate: number,
  consentRate: number
): number {
  // Weighted average of factors
  const emailWeight = 0.4
  const activityWeight = 0.3
  const consentWeight = 0.3

  const emailScore = Math.min(100, (validEmailRate / HEALTH_THRESHOLDS.validEmailMinRate) * 100)
  const activityScore = Math.max(
    0,
    ((HEALTH_THRESHOLDS.inactiveMaxRate - inactiveRate) / HEALTH_THRESHOLDS.inactiveMaxRate) * 100
  )
  const consentScore = Math.min(100, (consentRate / HEALTH_THRESHOLDS.consentMinRate) * 100)

  return Math.round(
    emailScore * emailWeight + activityScore * activityWeight + consentScore * consentWeight
  )
}

/**
 * Generate health recommendations based on metrics
 */
export function generateHealthRecommendations(health: ContactHealth): string[] {
  const recommendations: string[] = []

  if (health.validEmailRate < HEALTH_THRESHOLDS.validEmailMinRate) {
    recommendations.push(
      `${health.invalidEmails} contacts have invalid emails. Consider running email verification.`
    )
  }

  if (health.inactiveRate > HEALTH_THRESHOLDS.inactiveMaxRate) {
    recommendations.push(
      `${health.inactiveContacts} contacts have been inactive for over ${INACTIVE_DAYS_THRESHOLD} days. Consider a re-engagement campaign.`
    )
  }

  if (health.withoutConsentRate > 100 - HEALTH_THRESHOLDS.consentMinRate) {
    recommendations.push(
      `${health.withoutConsent} contacts lack valid marketing consent. Consider sending consent requests.`
    )
  }

  if (health.qualityScore >= 90) {
    recommendations.push('Your contact database health is excellent!')
  } else if (health.qualityScore >= 70) {
    recommendations.push('Your contact database health is good with some room for improvement.')
  }

  return recommendations
}

/**
 * Build contact health report
 */
export function buildContactHealth(stats: {
  total: number
  validEmails: number
  invalidEmails: number
  inactive: number
  withConsent: number
}): ContactHealth {
  const validEmailRate = calculateEngagementRate(stats.validEmails, stats.total)
  const inactiveRate = calculateEngagementRate(stats.inactive, stats.total)
  const consentRate = calculateEngagementRate(stats.withConsent, stats.total)
  const withoutConsentRate = 100 - consentRate

  const health: ContactHealth = {
    validEmails: stats.validEmails,
    invalidEmails: stats.invalidEmails,
    validEmailRate,
    inactiveContacts: stats.inactive,
    inactiveRate,
    withoutConsent: stats.total - stats.withConsent,
    withoutConsentRate,
    qualityScore: calculateHealthScore(validEmailRate, inactiveRate, consentRate),
    recommendations: []
  }

  health.recommendations = generateHealthRecommendations(health)

  return health
}

/**
 * Calculate source distribution percentages
 */
export function calculateSourceDistribution(
  sources: { source: string; count: number }[]
): SourceDistribution[] {
  const total = sources.reduce((sum, s) => sum + s.count, 0)
  if (total === 0) return []

  return sources.map((s) => ({
    source: s.source,
    count: s.count,
    percentage: Math.round((s.count / total) * 1000) / 10
  }))
}

/**
 * Get date range for metric period
 */
export function getDateRangeForPeriod(period: MetricPeriod): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  let start: Date

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      end.setDate(end.getDate() - 1)
      break
    case 'last_7_days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'last_30_days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'last_90_days':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end.setDate(0) // Last day of previous month
      break
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    case 'all_time':
      start = new Date(0)
      break
    default:
      start = new Date(0)
      break
  }

  return { start, end }
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(period: MetricPeriod): { start: Date; end: Date } {
  const current = getDateRangeForPeriod(period)
  const duration = current.end.getTime() - current.start.getTime()

  return {
    start: new Date(current.start.getTime() - duration),
    end: new Date(current.start.getTime() - 1)
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, type: 'number' | 'percentage' | 'rate'): string {
  switch (type) {
    case 'percentage':
    case 'rate':
      return `${value.toFixed(1)}%`
    case 'number':
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toString()
  }
}

/**
 * Format growth rate for display with sign
 */
export function formatGrowthRate(rate: number): string {
  const prefix = rate > 0 ? '+' : ''
  return `${prefix}${rate.toFixed(1)}%`
}

/**
 * Get engagement level label based on rate
 */
export function getEngagementLevel(rate: number): 'low' | 'medium' | 'high' | 'excellent' {
  if (rate >= HEALTH_THRESHOLDS.excellentEngagementRate) return 'excellent'
  if (rate >= HEALTH_THRESHOLDS.goodEngagementRate) return 'high'
  if (rate >= 10) return 'medium'
  return 'low'
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(
  score: number
): 'critical' | 'poor' | 'fair' | 'good' | 'excellent' {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 50) return 'fair'
  if (score >= 25) return 'poor'
  return 'critical'
}

/**
 * Get health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 90) return '#22c55e' // green
  if (score >= 75) return '#84cc16' // lime
  if (score >= 50) return '#eab308' // yellow
  if (score >= 25) return '#f97316' // orange
  return '#ef4444' // red
}
