import { z } from 'zod'

/**
 * CFP statistics for reports
 */
export const cfpStatsSchema = z.object({
  totalSubmissions: z.number(),
  pendingReviews: z.number(),
  acceptedTalks: z.number(),
  rejectedTalks: z.number(),
  acceptanceRate: z.number(),
  averageReviewsPerTalk: z.number(),
  submissionsByCategory: z.array(
    z.object({
      category: z.string(),
      count: z.number()
    })
  )
})
export type CfpStats = z.infer<typeof cfpStatsSchema>

/**
 * Billing statistics for reports
 */
export const billingStatsSchema = z.object({
  totalOrders: z.number(),
  paidOrders: z.number(),
  totalRevenue: z.number(),
  currency: z.string(),
  ticketsSold: z.number(),
  ticketsRemaining: z.number(),
  capacityPercentage: z.number(),
  revenueByTicketType: z.array(
    z.object({
      ticketType: z.string(),
      revenue: z.number(),
      quantity: z.number()
    })
  )
})
export type BillingStats = z.infer<typeof billingStatsSchema>

/**
 * Planning statistics for reports
 */
export const planningStatsSchema = z.object({
  totalSessions: z.number(),
  scheduledSessions: z.number(),
  unscheduledSessions: z.number(),
  totalRooms: z.number(),
  roomOccupancy: z.number(),
  conflictsDetected: z.number(),
  sessionsByTrack: z.array(
    z.object({
      track: z.string(),
      count: z.number()
    })
  )
})
export type PlanningStats = z.infer<typeof planningStatsSchema>

/**
 * CRM statistics for reports
 */
export const crmStatsSchema = z.object({
  totalContacts: z.number(),
  newContactsThisWeek: z.number(),
  activeCampaigns: z.number(),
  averageOpenRate: z.number(),
  averageClickRate: z.number(),
  contactsBySegment: z.array(
    z.object({
      segment: z.string(),
      count: z.number()
    })
  )
})
export type CrmStats = z.infer<typeof crmStatsSchema>

/**
 * Budget statistics for reports
 */
export const budgetStatsSchema = z.object({
  totalBudget: z.number(),
  totalSpent: z.number(),
  totalRevenue: z.number(),
  balance: z.number(),
  currency: z.string(),
  budgetUtilization: z.number(),
  expensesByCategory: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      budgeted: z.number()
    })
  )
})
export type BudgetStats = z.infer<typeof budgetStatsSchema>

/**
 * Sponsoring statistics for reports
 */
export const sponsoringStatsSchema = z.object({
  totalSponsors: z.number(),
  confirmedSponsors: z.number(),
  pendingSponsors: z.number(),
  totalRevenue: z.number(),
  revenueTarget: z.number(),
  revenueProgress: z.number(),
  currency: z.string(),
  sponsorsByPackage: z.array(
    z.object({
      package: z.string(),
      count: z.number(),
      revenue: z.number()
    })
  )
})
export type SponsoringStats = z.infer<typeof sponsoringStatsSchema>

/**
 * Complete report data
 */
export const reportDataSchema = z.object({
  editionId: z.string(),
  editionName: z.string(),
  eventName: z.string(),
  generatedAt: z.date(),
  period: z.object({
    start: z.date(),
    end: z.date()
  }),
  cfp: cfpStatsSchema.optional(),
  billing: billingStatsSchema.optional(),
  planning: planningStatsSchema.optional(),
  crm: crmStatsSchema.optional(),
  budget: budgetStatsSchema.optional(),
  sponsoring: sponsoringStatsSchema.optional()
})

export type ReportData = z.infer<typeof reportDataSchema>

/**
 * Calculate trend indicator
 */
export const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  if (previous === 0) return current > 0 ? 'up' : 'stable'
  const change = ((current - previous) / previous) * 100
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100) / 100}%`
}

/**
 * Format currency for display
 */
export const formatCurrency = (cents: number, currency: string): string => {
  return `${(cents / 100).toFixed(2)} ${currency}`
}
