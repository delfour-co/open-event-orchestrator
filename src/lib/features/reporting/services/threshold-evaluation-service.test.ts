import { describe, expect, it } from 'vitest'
import type { AlertThreshold } from '../domain/alert-threshold'
import { type EditionMetrics, createEmptyEditionMetrics } from '../domain/metrics'
import {
  createAlertFromThreshold,
  evaluateSingleThreshold,
  evaluateThresholds,
  getMetricValue,
  getTriggeredThresholds
} from './threshold-evaluation-service'

describe('threshold-evaluation-service', () => {
  const createMetrics = (overrides: Partial<EditionMetrics> = {}): EditionMetrics => ({
    ...createEmptyEditionMetrics(),
    ...overrides
  })

  const createThreshold = (overrides: Partial<AlertThreshold> = {}): AlertThreshold => ({
    id: 'threshold-1',
    editionId: 'edition-1',
    name: 'Test Threshold',
    metricSource: 'billing_sales',
    operator: 'lt',
    thresholdValue: 100,
    level: 'warning',
    enabled: true,
    notifyByEmail: false,
    notifyInApp: true,
    emailRecipients: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  describe('getMetricValue', () => {
    it('should extract CFP submission count', () => {
      const metrics = createMetrics({
        cfp: {
          totalSubmissions: 42,
          pendingReviews: 10,
          acceptedTalks: 15,
          rejectedTalks: 5,
          speakersCount: 30,
          averageRating: 4.2
        }
      })

      const result = getMetricValue(metrics, 'cfp_submissions')
      expect(result.value).toBe(42)
      expect(result.unit).toBeUndefined()
    })

    it('should calculate CFP acceptance rate as percentage', () => {
      const metrics = createMetrics({
        cfp: {
          totalSubmissions: 100,
          pendingReviews: 0,
          acceptedTalks: 25,
          rejectedTalks: 75,
          speakersCount: 80,
          averageRating: 3.5
        }
      })

      const result = getMetricValue(metrics, 'cfp_acceptance_rate')
      expect(result.value).toBe(25)
      expect(result.unit).toBe('%')
    })

    it('should handle zero submissions for acceptance rate', () => {
      const metrics = createMetrics()
      const result = getMetricValue(metrics, 'cfp_acceptance_rate')
      expect(result.value).toBe(0)
      expect(result.unit).toBe('%')
    })

    it('should extract billing revenue with currency', () => {
      const metrics = createMetrics({
        billing: {
          totalRevenue: 50000,
          currency: 'EUR',
          ticketsSold: 100,
          ticketsAvailable: 400,
          ordersCount: 80,
          paidOrdersCount: 75,
          checkInRate: 0,
          ticketsCheckedIn: 0
        }
      })

      const result = getMetricValue(metrics, 'billing_revenue')
      expect(result.value).toBe(50000)
      expect(result.unit).toBe('EUR')
    })

    it('should extract billing stock', () => {
      const metrics = createMetrics({
        billing: {
          totalRevenue: 0,
          currency: 'EUR',
          ticketsSold: 50,
          ticketsAvailable: 150,
          ordersCount: 0,
          paidOrdersCount: 0,
          checkInRate: 0,
          ticketsCheckedIn: 0
        }
      })

      const result = getMetricValue(metrics, 'billing_stock')
      expect(result.value).toBe(150)
    })

    it('should calculate budget variance', () => {
      const metrics = createMetrics({
        budget: {
          totalBudget: 10000,
          spent: 11500,
          remaining: -1500,
          currency: 'EUR',
          transactionsCount: 50
        }
      })

      const result = getMetricValue(metrics, 'budget_variance')
      expect(result.value).toBe(15) // 15% over budget
      expect(result.unit).toBe('%')
    })

    it('should handle zero budget for variance', () => {
      const metrics = createMetrics()
      const result = getMetricValue(metrics, 'budget_variance')
      expect(result.value).toBe(0)
    })

    it('should calculate planning occupancy', () => {
      const metrics = createMetrics({
        planning: {
          totalSessions: 50,
          scheduledSessions: 40,
          unscheduledSessions: 10,
          tracksCount: 4,
          roomsCount: 5,
          slotsUsed: 80,
          slotsAvailable: 100
        }
      })

      const result = getMetricValue(metrics, 'planning_occupancy')
      expect(result.value).toBe(80)
      expect(result.unit).toBe('%')
    })

    it('should extract sponsoring revenue', () => {
      const metrics = createMetrics({
        sponsoring: {
          totalSponsors: 10,
          confirmedSponsors: 8,
          pendingSponsors: 2,
          totalSponsorshipValue: 75000,
          currency: 'USD'
        }
      })

      const result = getMetricValue(metrics, 'sponsoring_revenue')
      expect(result.value).toBe(75000)
      expect(result.unit).toBe('USD')
    })
  })

  describe('evaluateSingleThreshold', () => {
    it('should trigger when value is below threshold (lt)', () => {
      const threshold = createThreshold({
        metricSource: 'billing_sales',
        operator: 'lt',
        thresholdValue: 100
      })
      const metrics = createMetrics({
        billing: {
          totalRevenue: 0,
          currency: 'EUR',
          ticketsSold: 50,
          ticketsAvailable: 0,
          ordersCount: 0,
          paidOrdersCount: 0,
          checkInRate: 0,
          ticketsCheckedIn: 0
        }
      })

      const result = evaluateSingleThreshold(threshold, metrics)
      expect(result.triggered).toBe(true)
      expect(result.currentValue).toBe(50)
    })

    it('should not trigger when value is above threshold (lt)', () => {
      const threshold = createThreshold({
        metricSource: 'billing_sales',
        operator: 'lt',
        thresholdValue: 100
      })
      const metrics = createMetrics({
        billing: {
          totalRevenue: 0,
          currency: 'EUR',
          ticketsSold: 150,
          ticketsAvailable: 0,
          ordersCount: 0,
          paidOrdersCount: 0,
          checkInRate: 0,
          ticketsCheckedIn: 0
        }
      })

      const result = evaluateSingleThreshold(threshold, metrics)
      expect(result.triggered).toBe(false)
      expect(result.currentValue).toBe(150)
    })

    it('should trigger when value exceeds threshold (gt)', () => {
      const threshold = createThreshold({
        metricSource: 'planning_conflicts',
        operator: 'gt',
        thresholdValue: 0,
        level: 'critical'
      })
      const metrics = createMetrics({
        planning: {
          totalSessions: 50,
          scheduledSessions: 45,
          unscheduledSessions: 5,
          tracksCount: 4,
          roomsCount: 5,
          slotsUsed: 80,
          slotsAvailable: 100
        }
      })

      const result = evaluateSingleThreshold(threshold, metrics)
      expect(result.triggered).toBe(true)
      expect(result.currentValue).toBe(5)
    })
  })

  describe('evaluateThresholds', () => {
    it('should evaluate multiple thresholds', () => {
      const thresholds = [
        createThreshold({
          id: 't1',
          metricSource: 'billing_sales',
          operator: 'lt',
          thresholdValue: 100
        }),
        createThreshold({
          id: 't2',
          metricSource: 'cfp_submissions',
          operator: 'lt',
          thresholdValue: 50
        })
      ]
      const metrics = createMetrics({
        billing: {
          totalRevenue: 0,
          currency: 'EUR',
          ticketsSold: 80,
          ticketsAvailable: 0,
          ordersCount: 0,
          paidOrdersCount: 0,
          checkInRate: 0,
          ticketsCheckedIn: 0
        },
        cfp: {
          totalSubmissions: 60,
          pendingReviews: 0,
          acceptedTalks: 0,
          rejectedTalks: 0,
          speakersCount: 0,
          averageRating: 0
        }
      })

      const results = evaluateThresholds(thresholds, metrics)
      expect(results).toHaveLength(2)
      expect(results[0].triggered).toBe(true) // billing_sales 80 < 100
      expect(results[1].triggered).toBe(false) // cfp_submissions 60 >= 50
    })

    it('should skip disabled thresholds', () => {
      const thresholds = [
        createThreshold({ id: 't1', enabled: true }),
        createThreshold({ id: 't2', enabled: false })
      ]
      const metrics = createMetrics()

      const results = evaluateThresholds(thresholds, metrics)
      expect(results).toHaveLength(1)
      expect(results[0].threshold.id).toBe('t1')
    })
  })

  describe('getTriggeredThresholds', () => {
    it('should return only triggered thresholds', () => {
      const thresholds = [
        createThreshold({
          id: 't1',
          metricSource: 'billing_sales',
          operator: 'lt',
          thresholdValue: 100
        }),
        createThreshold({
          id: 't2',
          metricSource: 'cfp_submissions',
          operator: 'gt',
          thresholdValue: 1000
        })
      ]
      const metrics = createMetrics({
        billing: {
          totalRevenue: 0,
          currency: 'EUR',
          ticketsSold: 50,
          ticketsAvailable: 0,
          ordersCount: 0,
          paidOrdersCount: 0,
          checkInRate: 0,
          ticketsCheckedIn: 0
        },
        cfp: {
          totalSubmissions: 100,
          pendingReviews: 0,
          acceptedTalks: 0,
          rejectedTalks: 0,
          speakersCount: 0,
          averageRating: 0
        }
      })

      const results = getTriggeredThresholds(thresholds, metrics)
      expect(results).toHaveLength(1)
      expect(results[0].threshold.id).toBe('t1')
    })
  })

  describe('createAlertFromThreshold', () => {
    it('should create alert with correct data', () => {
      const threshold = createThreshold({
        name: 'Low Sales Alert',
        level: 'warning'
      })
      const evaluation = {
        threshold,
        triggered: true,
        currentValue: 50,
        unit: undefined
      }

      const alert = createAlertFromThreshold(evaluation, 'edition-1')

      expect(alert.editionId).toBe('edition-1')
      expect(alert.thresholdId).toBe(threshold.id)
      expect(alert.title).toBe('Low Sales Alert')
      expect(alert.level).toBe('warning')
      expect(alert.currentValue).toBe(50)
      expect(alert.thresholdValue).toBe(100)
      expect(alert.message).toContain('50')
      expect(alert.message).toContain('100')
    })

    it('should format message with unit', () => {
      const threshold = createThreshold({
        name: 'Budget Variance',
        metricSource: 'budget_variance',
        operator: 'gt',
        thresholdValue: 10,
        level: 'critical'
      })
      const evaluation = {
        threshold,
        triggered: true,
        currentValue: 15,
        unit: '%'
      }

      const alert = createAlertFromThreshold(evaluation, 'edition-1')

      expect(alert.message).toContain('15%')
      expect(alert.message).toContain('10%')
    })
  })
})
