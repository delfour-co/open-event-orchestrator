import { describe, expect, it } from 'vitest'
import {
  type BillingStats,
  type BudgetStats,
  type CfpStats,
  type CrmStats,
  type PlanningStats,
  type ReportData,
  type SponsoringStats,
  billingStatsSchema,
  budgetStatsSchema,
  calculateTrend,
  cfpStatsSchema,
  crmStatsSchema,
  formatCurrency,
  formatPercentage,
  planningStatsSchema,
  reportDataSchema,
  sponsoringStatsSchema
} from './report-data'

describe('report-data', () => {
  describe('cfpStatsSchema', () => {
    const validCfpStats: CfpStats = {
      totalSubmissions: 100,
      pendingReviews: 25,
      acceptedTalks: 40,
      rejectedTalks: 35,
      acceptanceRate: 40,
      averageReviewsPerTalk: 3.5,
      submissionsByCategory: [
        { category: 'Web', count: 30 },
        { category: 'Mobile', count: 20 }
      ]
    }

    it('should accept valid CFP stats', () => {
      const result = cfpStatsSchema.parse(validCfpStats)
      expect(result).toEqual(validCfpStats)
    })

    it('should require all fields', () => {
      const incomplete = { totalSubmissions: 100 }
      expect(() => cfpStatsSchema.parse(incomplete)).toThrow()
    })

    it('should accept empty submissionsByCategory array', () => {
      const stats = { ...validCfpStats, submissionsByCategory: [] }
      const result = cfpStatsSchema.parse(stats)
      expect(result.submissionsByCategory).toEqual([])
    })
  })

  describe('billingStatsSchema', () => {
    const validBillingStats: BillingStats = {
      totalOrders: 150,
      paidOrders: 130,
      totalRevenue: 5000000,
      currency: 'EUR',
      ticketsSold: 200,
      ticketsRemaining: 100,
      capacityPercentage: 66.67,
      revenueByTicketType: [
        { ticketType: 'Standard', revenue: 3000000, quantity: 120 },
        { ticketType: 'VIP', revenue: 2000000, quantity: 80 }
      ]
    }

    it('should accept valid billing stats', () => {
      const result = billingStatsSchema.parse(validBillingStats)
      expect(result).toEqual(validBillingStats)
    })

    it('should require currency field', () => {
      const stats = { ...validBillingStats }
      ;(stats as Record<string, unknown>).currency = undefined
      expect(() => billingStatsSchema.parse(stats)).toThrow()
    })

    it('should accept empty revenueByTicketType array', () => {
      const stats = { ...validBillingStats, revenueByTicketType: [] }
      const result = billingStatsSchema.parse(stats)
      expect(result.revenueByTicketType).toEqual([])
    })
  })

  describe('planningStatsSchema', () => {
    const validPlanningStats: PlanningStats = {
      totalSessions: 50,
      scheduledSessions: 45,
      unscheduledSessions: 5,
      totalRooms: 3,
      roomOccupancy: 85,
      conflictsDetected: 2,
      sessionsByTrack: [
        { track: 'Web', count: 20 },
        { track: 'Cloud', count: 15 }
      ]
    }

    it('should accept valid planning stats', () => {
      const result = planningStatsSchema.parse(validPlanningStats)
      expect(result).toEqual(validPlanningStats)
    })

    it('should accept zero conflicts', () => {
      const stats = { ...validPlanningStats, conflictsDetected: 0 }
      const result = planningStatsSchema.parse(stats)
      expect(result.conflictsDetected).toBe(0)
    })
  })

  describe('crmStatsSchema', () => {
    const validCrmStats: CrmStats = {
      totalContacts: 500,
      newContactsThisWeek: 25,
      activeCampaigns: 3,
      averageOpenRate: 45.5,
      averageClickRate: 12.3,
      contactsBySegment: [
        { segment: 'Speakers', count: 50 },
        { segment: 'Attendees', count: 400 }
      ]
    }

    it('should accept valid CRM stats', () => {
      const result = crmStatsSchema.parse(validCrmStats)
      expect(result).toEqual(validCrmStats)
    })

    it('should accept decimal rates', () => {
      const stats = { ...validCrmStats, averageOpenRate: 45.789, averageClickRate: 12.345 }
      const result = crmStatsSchema.parse(stats)
      expect(result.averageOpenRate).toBe(45.789)
      expect(result.averageClickRate).toBe(12.345)
    })
  })

  describe('budgetStatsSchema', () => {
    const validBudgetStats: BudgetStats = {
      totalBudget: 10000000,
      totalSpent: 6500000,
      totalRevenue: 8000000,
      balance: 1500000,
      currency: 'EUR',
      budgetUtilization: 65,
      expensesByCategory: [
        { category: 'Venue', amount: 3000000, budgeted: 3500000 },
        { category: 'Catering', amount: 2000000, budgeted: 2000000 }
      ]
    }

    it('should accept valid budget stats', () => {
      const result = budgetStatsSchema.parse(validBudgetStats)
      expect(result).toEqual(validBudgetStats)
    })

    it('should accept negative balance', () => {
      const stats = { ...validBudgetStats, balance: -500000 }
      const result = budgetStatsSchema.parse(stats)
      expect(result.balance).toBe(-500000)
    })
  })

  describe('sponsoringStatsSchema', () => {
    const validSponsoringStats: SponsoringStats = {
      totalSponsors: 20,
      confirmedSponsors: 15,
      pendingSponsors: 5,
      totalRevenue: 5000000,
      revenueTarget: 6000000,
      revenueProgress: 83.33,
      currency: 'EUR',
      sponsorsByPackage: [
        { package: 'Gold', count: 3, revenue: 3000000 },
        { package: 'Silver', count: 7, revenue: 1400000 }
      ]
    }

    it('should accept valid sponsoring stats', () => {
      const result = sponsoringStatsSchema.parse(validSponsoringStats)
      expect(result).toEqual(validSponsoringStats)
    })

    it('should accept progress over 100%', () => {
      const stats = { ...validSponsoringStats, revenueProgress: 110 }
      const result = sponsoringStatsSchema.parse(stats)
      expect(result.revenueProgress).toBe(110)
    })
  })

  describe('reportDataSchema', () => {
    const validReportData: ReportData = {
      editionId: 'edition-123',
      editionName: 'DevFest Paris 2025',
      eventName: 'DevFest',
      generatedAt: new Date('2025-01-15'),
      period: {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31')
      }
    }

    it('should accept valid report data without optional sections', () => {
      const result = reportDataSchema.parse(validReportData)
      expect(result.editionId).toBe('edition-123')
      expect(result.cfp).toBeUndefined()
      expect(result.billing).toBeUndefined()
    })

    it('should accept report data with all sections', () => {
      const data: ReportData = {
        ...validReportData,
        cfp: {
          totalSubmissions: 100,
          pendingReviews: 25,
          acceptedTalks: 40,
          rejectedTalks: 35,
          acceptanceRate: 40,
          averageReviewsPerTalk: 3.5,
          submissionsByCategory: []
        },
        billing: {
          totalOrders: 150,
          paidOrders: 130,
          totalRevenue: 5000000,
          currency: 'EUR',
          ticketsSold: 200,
          ticketsRemaining: 100,
          capacityPercentage: 66.67,
          revenueByTicketType: []
        }
      }
      const result = reportDataSchema.parse(data)
      expect(result.cfp).toBeDefined()
      expect(result.billing).toBeDefined()
    })

    it('should require period dates', () => {
      const data = { ...validReportData }
      ;(data as Record<string, unknown>).period = undefined
      expect(() => reportDataSchema.parse(data)).toThrow()
    })
  })

  describe('calculateTrend', () => {
    it('should return up when current is significantly higher', () => {
      expect(calculateTrend(110, 100)).toBe('up')
      expect(calculateTrend(200, 100)).toBe('up')
    })

    it('should return down when current is significantly lower', () => {
      expect(calculateTrend(90, 100)).toBe('down')
      expect(calculateTrend(50, 100)).toBe('down')
    })

    it('should return stable when change is within 5%', () => {
      expect(calculateTrend(102, 100)).toBe('stable')
      expect(calculateTrend(98, 100)).toBe('stable')
      expect(calculateTrend(100, 100)).toBe('stable')
    })

    it('should return up when previous is 0 and current is positive', () => {
      expect(calculateTrend(10, 0)).toBe('up')
      expect(calculateTrend(1, 0)).toBe('up')
    })

    it('should return stable when both are 0', () => {
      expect(calculateTrend(0, 0)).toBe('stable')
    })

    it('should handle edge case at exactly 5% threshold', () => {
      expect(calculateTrend(105, 100)).toBe('stable')
      expect(calculateTrend(95, 100)).toBe('stable')
      expect(calculateTrend(105.01, 100)).toBe('up')
      expect(calculateTrend(94.99, 100)).toBe('down')
    })
  })

  describe('formatPercentage', () => {
    it('should format whole numbers', () => {
      expect(formatPercentage(50)).toBe('50%')
      expect(formatPercentage(100)).toBe('100%')
      expect(formatPercentage(0)).toBe('0%')
    })

    it('should format decimals to 2 decimal places', () => {
      expect(formatPercentage(45.5)).toBe('45.5%')
      expect(formatPercentage(33.333)).toBe('33.33%')
      expect(formatPercentage(66.666)).toBe('66.67%')
    })

    it('should handle very small values', () => {
      expect(formatPercentage(0.01)).toBe('0.01%')
      expect(formatPercentage(0.001)).toBe('0%')
    })
  })

  describe('formatCurrency', () => {
    it('should format cents to currency display', () => {
      expect(formatCurrency(10000, 'EUR')).toBe('100.00 EUR')
      expect(formatCurrency(5000, 'USD')).toBe('50.00 USD')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0, 'EUR')).toBe('0.00 EUR')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000, 'EUR')).toBe('10000.00 EUR')
      expect(formatCurrency(100000000, 'EUR')).toBe('1000000.00 EUR')
    })

    it('should handle decimals correctly', () => {
      expect(formatCurrency(1050, 'EUR')).toBe('10.50 EUR')
      expect(formatCurrency(1001, 'USD')).toBe('10.01 USD')
    })

    it('should work with different currencies', () => {
      expect(formatCurrency(5000, 'GBP')).toBe('50.00 GBP')
      expect(formatCurrency(5000, 'CHF')).toBe('50.00 CHF')
      expect(formatCurrency(5000, 'JPY')).toBe('50.00 JPY')
    })
  })
})
