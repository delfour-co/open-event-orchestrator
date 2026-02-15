import { describe, expect, it } from 'vitest'
import {
  createEmptyBillingMetrics,
  createEmptyBudgetMetrics,
  createEmptyCfpMetrics,
  createEmptyCrmMetrics,
  createEmptyEditionMetrics,
  createEmptyPlanningMetrics,
  createEmptySponsoringMetrics,
  metricCategorySchema
} from './metrics'

describe('Metrics Domain', () => {
  describe('metricCategorySchema', () => {
    it('should accept valid categories', () => {
      expect(metricCategorySchema.parse('billing')).toBe('billing')
      expect(metricCategorySchema.parse('cfp')).toBe('cfp')
      expect(metricCategorySchema.parse('planning')).toBe('planning')
      expect(metricCategorySchema.parse('crm')).toBe('crm')
      expect(metricCategorySchema.parse('sponsoring')).toBe('sponsoring')
      expect(metricCategorySchema.parse('budget')).toBe('budget')
    })

    it('should reject invalid categories', () => {
      expect(() => metricCategorySchema.parse('invalid')).toThrow()
    })
  })

  describe('createEmptyBillingMetrics', () => {
    it('should create empty billing metrics with correct defaults', () => {
      const metrics = createEmptyBillingMetrics()

      expect(metrics.totalRevenue).toBe(0)
      expect(metrics.currency).toBe('EUR')
      expect(metrics.ticketsSold).toBe(0)
      expect(metrics.ticketsAvailable).toBe(0)
      expect(metrics.ordersCount).toBe(0)
      expect(metrics.paidOrdersCount).toBe(0)
      expect(metrics.checkInRate).toBe(0)
      expect(metrics.ticketsCheckedIn).toBe(0)
    })
  })

  describe('createEmptyCfpMetrics', () => {
    it('should create empty CFP metrics with correct defaults', () => {
      const metrics = createEmptyCfpMetrics()

      expect(metrics.totalSubmissions).toBe(0)
      expect(metrics.pendingReviews).toBe(0)
      expect(metrics.acceptedTalks).toBe(0)
      expect(metrics.rejectedTalks).toBe(0)
      expect(metrics.speakersCount).toBe(0)
      expect(metrics.averageRating).toBe(0)
    })
  })

  describe('createEmptyPlanningMetrics', () => {
    it('should create empty planning metrics with correct defaults', () => {
      const metrics = createEmptyPlanningMetrics()

      expect(metrics.totalSessions).toBe(0)
      expect(metrics.scheduledSessions).toBe(0)
      expect(metrics.unscheduledSessions).toBe(0)
      expect(metrics.tracksCount).toBe(0)
      expect(metrics.roomsCount).toBe(0)
      expect(metrics.slotsUsed).toBe(0)
      expect(metrics.slotsAvailable).toBe(0)
    })
  })

  describe('createEmptyCrmMetrics', () => {
    it('should create empty CRM metrics with correct defaults', () => {
      const metrics = createEmptyCrmMetrics()

      expect(metrics.totalContacts).toBe(0)
      expect(metrics.newContactsThisWeek).toBe(0)
      expect(metrics.emailsSent).toBe(0)
      expect(metrics.openRate).toBe(0)
      expect(metrics.clickRate).toBe(0)
    })
  })

  describe('createEmptySponsoringMetrics', () => {
    it('should create empty sponsoring metrics with correct defaults', () => {
      const metrics = createEmptySponsoringMetrics()

      expect(metrics.totalSponsors).toBe(0)
      expect(metrics.confirmedSponsors).toBe(0)
      expect(metrics.pendingSponsors).toBe(0)
      expect(metrics.totalSponsorshipValue).toBe(0)
      expect(metrics.currency).toBe('EUR')
    })
  })

  describe('createEmptyBudgetMetrics', () => {
    it('should create empty budget metrics with correct defaults', () => {
      const metrics = createEmptyBudgetMetrics()

      expect(metrics.totalBudget).toBe(0)
      expect(metrics.spent).toBe(0)
      expect(metrics.remaining).toBe(0)
      expect(metrics.currency).toBe('EUR')
      expect(metrics.transactionsCount).toBe(0)
    })
  })

  describe('createEmptyEditionMetrics', () => {
    it('should create complete empty edition metrics', () => {
      const metrics = createEmptyEditionMetrics()

      expect(metrics.billing).toBeDefined()
      expect(metrics.cfp).toBeDefined()
      expect(metrics.planning).toBeDefined()
      expect(metrics.crm).toBeDefined()
      expect(metrics.sponsoring).toBeDefined()
      expect(metrics.budget).toBeDefined()
      expect(metrics.lastUpdated).toBeInstanceOf(Date)
    })

    it('should have all nested metrics initialized', () => {
      const metrics = createEmptyEditionMetrics()

      expect(metrics.billing.totalRevenue).toBe(0)
      expect(metrics.cfp.totalSubmissions).toBe(0)
      expect(metrics.planning.totalSessions).toBe(0)
      expect(metrics.crm.totalContacts).toBe(0)
      expect(metrics.sponsoring.totalSponsors).toBe(0)
      expect(metrics.budget.totalBudget).toBe(0)
    })
  })
})
