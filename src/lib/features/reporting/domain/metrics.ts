import { z } from 'zod'

export const metricCategorySchema = z.enum([
  'billing',
  'cfp',
  'planning',
  'crm',
  'sponsoring',
  'budget'
])

export type MetricCategory = z.infer<typeof metricCategorySchema>

export type BillingMetrics = {
  totalRevenue: number
  currency: string
  ticketsSold: number
  ticketsAvailable: number
  ordersCount: number
  paidOrdersCount: number
  checkInRate: number
  ticketsCheckedIn: number
}

export type CfpMetrics = {
  totalSubmissions: number
  pendingReviews: number
  acceptedTalks: number
  rejectedTalks: number
  speakersCount: number
  averageRating: number
}

export type PlanningMetrics = {
  totalSessions: number
  scheduledSessions: number
  unscheduledSessions: number
  tracksCount: number
  roomsCount: number
  slotsUsed: number
  slotsAvailable: number
}

export type CrmMetrics = {
  totalContacts: number
  newContactsThisWeek: number
  emailsSent: number
  openRate: number
  clickRate: number
}

export type SponsoringMetrics = {
  totalSponsors: number
  confirmedSponsors: number
  pendingSponsors: number
  totalSponsorshipValue: number
  currency: string
}

export type BudgetMetrics = {
  totalBudget: number
  spent: number
  remaining: number
  currency: string
  transactionsCount: number
}

export type EditionMetrics = {
  billing: BillingMetrics
  cfp: CfpMetrics
  planning: PlanningMetrics
  crm: CrmMetrics
  sponsoring: SponsoringMetrics
  budget: BudgetMetrics
  lastUpdated: Date
}

export const createEmptyBillingMetrics = (): BillingMetrics => ({
  totalRevenue: 0,
  currency: 'EUR',
  ticketsSold: 0,
  ticketsAvailable: 0,
  ordersCount: 0,
  paidOrdersCount: 0,
  checkInRate: 0,
  ticketsCheckedIn: 0
})

export const createEmptyCfpMetrics = (): CfpMetrics => ({
  totalSubmissions: 0,
  pendingReviews: 0,
  acceptedTalks: 0,
  rejectedTalks: 0,
  speakersCount: 0,
  averageRating: 0
})

export const createEmptyPlanningMetrics = (): PlanningMetrics => ({
  totalSessions: 0,
  scheduledSessions: 0,
  unscheduledSessions: 0,
  tracksCount: 0,
  roomsCount: 0,
  slotsUsed: 0,
  slotsAvailable: 0
})

export const createEmptyCrmMetrics = (): CrmMetrics => ({
  totalContacts: 0,
  newContactsThisWeek: 0,
  emailsSent: 0,
  openRate: 0,
  clickRate: 0
})

export const createEmptySponsoringMetrics = (): SponsoringMetrics => ({
  totalSponsors: 0,
  confirmedSponsors: 0,
  pendingSponsors: 0,
  totalSponsorshipValue: 0,
  currency: 'EUR'
})

export const createEmptyBudgetMetrics = (): BudgetMetrics => ({
  totalBudget: 0,
  spent: 0,
  remaining: 0,
  currency: 'EUR',
  transactionsCount: 0
})

export const createEmptyEditionMetrics = (): EditionMetrics => ({
  billing: createEmptyBillingMetrics(),
  cfp: createEmptyCfpMetrics(),
  planning: createEmptyPlanningMetrics(),
  crm: createEmptyCrmMetrics(),
  sponsoring: createEmptySponsoringMetrics(),
  budget: createEmptyBudgetMetrics(),
  lastUpdated: new Date()
})
