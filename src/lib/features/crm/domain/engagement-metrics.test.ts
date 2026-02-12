import { describe, expect, it } from 'vitest'
import {
  buildContactHealth,
  buildEmailMetrics,
  calculateBounceRate,
  calculateClickRate,
  calculateClickToOpenRate,
  calculateDeliveryRate,
  calculateEngagementRate,
  calculateGrowthRate,
  calculateHealthScore,
  calculateOpenRate,
  calculateSourceDistribution,
  calculateUnsubscribeRate,
  formatGrowthRate,
  formatMetricValue,
  getDateRangeForPeriod,
  getEngagementLevel,
  getHealthScoreColor,
  getHealthScoreLabel,
  getPreviousPeriod,
  getTrendDirection
} from './engagement-metrics'

describe('engagement-metrics', () => {
  describe('calculateEngagementRate', () => {
    it('should calculate correct rate', () => {
      expect(calculateEngagementRate(25, 100)).toBe(25)
      expect(calculateEngagementRate(50, 200)).toBe(25)
    })

    it('should return 0 for zero total', () => {
      expect(calculateEngagementRate(0, 0)).toBe(0)
    })

    it('should round to one decimal place', () => {
      expect(calculateEngagementRate(1, 3)).toBe(33.3)
      expect(calculateEngagementRate(2, 3)).toBe(66.7)
    })
  })

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth', () => {
      expect(calculateGrowthRate(120, 100)).toBe(20)
      expect(calculateGrowthRate(150, 100)).toBe(50)
    })

    it('should calculate negative growth', () => {
      expect(calculateGrowthRate(80, 100)).toBe(-20)
      expect(calculateGrowthRate(50, 100)).toBe(-50)
    })

    it('should return 100 when previous is 0 and current > 0', () => {
      expect(calculateGrowthRate(50, 0)).toBe(100)
    })

    it('should return 0 when both are 0', () => {
      expect(calculateGrowthRate(0, 0)).toBe(0)
    })
  })

  describe('getTrendDirection', () => {
    it('should return up for positive growth', () => {
      expect(getTrendDirection(5)).toBe('up')
      expect(getTrendDirection(10)).toBe('up')
    })

    it('should return down for negative growth', () => {
      expect(getTrendDirection(-5)).toBe('down')
      expect(getTrendDirection(-10)).toBe('down')
    })

    it('should return stable for small changes', () => {
      expect(getTrendDirection(0)).toBe('stable')
      expect(getTrendDirection(0.5)).toBe('stable')
      expect(getTrendDirection(-0.5)).toBe('stable')
    })
  })

  describe('calculateDeliveryRate', () => {
    it('should calculate delivery rate', () => {
      expect(calculateDeliveryRate(95, 100)).toBe(95)
      expect(calculateDeliveryRate(980, 1000)).toBe(98)
    })

    it('should return 0 for zero sent', () => {
      expect(calculateDeliveryRate(0, 0)).toBe(0)
    })
  })

  describe('calculateOpenRate', () => {
    it('should calculate open rate', () => {
      expect(calculateOpenRate(40, 100)).toBe(40)
      expect(calculateOpenRate(25, 50)).toBe(50)
    })

    it('should return 0 for zero delivered', () => {
      expect(calculateOpenRate(0, 0)).toBe(0)
    })
  })

  describe('calculateClickRate', () => {
    it('should calculate click rate', () => {
      expect(calculateClickRate(10, 100)).toBe(10)
      expect(calculateClickRate(5, 50)).toBe(10)
    })

    it('should return 0 for zero delivered', () => {
      expect(calculateClickRate(0, 0)).toBe(0)
    })
  })

  describe('calculateClickToOpenRate', () => {
    it('should calculate click to open rate', () => {
      expect(calculateClickToOpenRate(10, 40)).toBe(25)
      expect(calculateClickToOpenRate(5, 20)).toBe(25)
    })

    it('should return 0 for zero opened', () => {
      expect(calculateClickToOpenRate(0, 0)).toBe(0)
    })
  })

  describe('calculateBounceRate', () => {
    it('should calculate bounce rate', () => {
      expect(calculateBounceRate(5, 100)).toBe(5)
      expect(calculateBounceRate(20, 1000)).toBe(2)
    })

    it('should return 0 for zero sent', () => {
      expect(calculateBounceRate(0, 0)).toBe(0)
    })
  })

  describe('calculateUnsubscribeRate', () => {
    it('should calculate unsubscribe rate', () => {
      expect(calculateUnsubscribeRate(2, 100)).toBe(2)
      expect(calculateUnsubscribeRate(1, 1000)).toBe(0.1)
    })

    it('should return 0 for zero delivered', () => {
      expect(calculateUnsubscribeRate(0, 0)).toBe(0)
    })
  })

  describe('buildEmailMetrics', () => {
    it('should build complete email metrics', () => {
      const metrics = buildEmailMetrics({
        sent: 1000,
        delivered: 950,
        opened: 400,
        clicked: 100,
        bounced: 50,
        unsubscribed: 5
      })

      expect(metrics.totalSent).toBe(1000)
      expect(metrics.totalDelivered).toBe(950)
      expect(metrics.totalOpened).toBe(400)
      expect(metrics.totalClicked).toBe(100)
      expect(metrics.deliveryRate).toBe(95)
      expect(metrics.openRate).toBeCloseTo(42.1, 1)
      expect(metrics.clickRate).toBeCloseTo(10.5, 1)
      expect(metrics.bounceRate).toBe(5)
      expect(metrics.clickToOpenRate).toBe(25)
    })
  })

  describe('calculateHealthScore', () => {
    it('should return high score for good metrics', () => {
      const score = calculateHealthScore(98, 10, 95)
      expect(score).toBeGreaterThan(80)
    })

    it('should return low score for poor metrics', () => {
      const score = calculateHealthScore(70, 40, 60)
      expect(score).toBeLessThan(60)
    })

    it('should weight factors appropriately', () => {
      // Perfect valid emails, bad activity and consent
      const score1 = calculateHealthScore(100, 50, 50)
      // Bad valid emails, perfect activity and consent
      const score2 = calculateHealthScore(50, 0, 100)

      // Both scores should be impacted by poor factors
      expect(score1).toBeLessThan(90)
      expect(score2).toBeLessThan(90)
      // With mixed metrics, neither should be perfect
      expect(score1).toBeGreaterThan(30)
      expect(score2).toBeGreaterThan(30)
    })
  })

  describe('buildContactHealth', () => {
    it('should build complete health report', () => {
      const health = buildContactHealth({
        total: 1000,
        validEmails: 950,
        invalidEmails: 50,
        inactive: 200,
        withConsent: 900
      })

      expect(health.validEmails).toBe(950)
      expect(health.invalidEmails).toBe(50)
      expect(health.validEmailRate).toBe(95)
      expect(health.inactiveContacts).toBe(200)
      expect(health.inactiveRate).toBe(20)
      expect(health.withoutConsent).toBe(100)
      expect(health.withoutConsentRate).toBe(10)
      expect(health.qualityScore).toBeGreaterThan(0)
      expect(health.recommendations).toBeDefined()
    })

    it('should generate recommendations for issues', () => {
      const health = buildContactHealth({
        total: 1000,
        validEmails: 800,
        invalidEmails: 200,
        inactive: 400,
        withConsent: 700
      })

      expect(health.recommendations.length).toBeGreaterThan(0)
      expect(health.recommendations.some((r) => r.includes('invalid'))).toBe(true)
      expect(health.recommendations.some((r) => r.includes('inactive'))).toBe(true)
      expect(health.recommendations.some((r) => r.includes('consent'))).toBe(true)
    })

    it('should generate positive message for good health', () => {
      const health = buildContactHealth({
        total: 1000,
        validEmails: 990,
        invalidEmails: 10,
        inactive: 50,
        withConsent: 950
      })

      expect(
        health.recommendations.some((r) => r.includes('excellent') || r.includes('good'))
      ).toBe(true)
    })
  })

  describe('calculateSourceDistribution', () => {
    it('should calculate percentages', () => {
      const sources = [
        { source: 'speaker', count: 50 },
        { source: 'attendee', count: 100 },
        { source: 'sponsor', count: 50 }
      ]

      const distribution = calculateSourceDistribution(sources)

      expect(distribution).toHaveLength(3)
      expect(distribution.find((s) => s.source === 'speaker')?.percentage).toBe(25)
      expect(distribution.find((s) => s.source === 'attendee')?.percentage).toBe(50)
      expect(distribution.find((s) => s.source === 'sponsor')?.percentage).toBe(25)
    })

    it('should return empty array for empty sources', () => {
      expect(calculateSourceDistribution([])).toHaveLength(0)
    })

    it('should return empty array for zero total', () => {
      const sources = [
        { source: 'speaker', count: 0 },
        { source: 'attendee', count: 0 }
      ]
      expect(calculateSourceDistribution(sources)).toHaveLength(0)
    })
  })

  describe('getDateRangeForPeriod', () => {
    it('should return today range', () => {
      const { start } = getDateRangeForPeriod('today')
      const now = new Date()

      expect(start.getDate()).toBe(now.getDate())
      expect(start.getMonth()).toBe(now.getMonth())
    })

    it('should return last 7 days range', () => {
      const { start, end } = getDateRangeForPeriod('last_7_days')
      const diff = end.getTime() - start.getTime()
      const days = diff / (24 * 60 * 60 * 1000)

      expect(days).toBeGreaterThanOrEqual(6)
      expect(days).toBeLessThanOrEqual(8)
    })

    it('should return last 30 days range', () => {
      const { start, end } = getDateRangeForPeriod('last_30_days')
      const diff = end.getTime() - start.getTime()
      const days = diff / (24 * 60 * 60 * 1000)

      expect(days).toBeGreaterThanOrEqual(29)
      expect(days).toBeLessThanOrEqual(31)
    })

    it('should return this month range', () => {
      const { start } = getDateRangeForPeriod('this_month')
      const now = new Date()

      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(now.getMonth())
    })

    it('should return all time range', () => {
      const { start } = getDateRangeForPeriod('all_time')
      expect(start.getTime()).toBe(0)
    })
  })

  describe('getPreviousPeriod', () => {
    it('should return previous period of same duration', () => {
      const current = getDateRangeForPeriod('last_7_days')
      const previous = getPreviousPeriod('last_7_days')

      const currentDuration = current.end.getTime() - current.start.getTime()
      const previousDuration = previous.end.getTime() - previous.start.getTime() + 1

      expect(previousDuration).toBeCloseTo(currentDuration, -3)
      expect(previous.end.getTime()).toBeLessThanOrEqual(current.start.getTime())
    })
  })

  describe('formatMetricValue', () => {
    it('should format numbers', () => {
      expect(formatMetricValue(500, 'number')).toBe('500')
      expect(formatMetricValue(1500, 'number')).toBe('1.5K')
      expect(formatMetricValue(1500000, 'number')).toBe('1.5M')
    })

    it('should format percentages', () => {
      expect(formatMetricValue(25.5, 'percentage')).toBe('25.5%')
      expect(formatMetricValue(100, 'percentage')).toBe('100.0%')
    })

    it('should format rates', () => {
      expect(formatMetricValue(42.1, 'rate')).toBe('42.1%')
    })
  })

  describe('formatGrowthRate', () => {
    it('should format positive growth with plus sign', () => {
      expect(formatGrowthRate(25)).toBe('+25.0%')
      expect(formatGrowthRate(5.5)).toBe('+5.5%')
    })

    it('should format negative growth', () => {
      expect(formatGrowthRate(-10)).toBe('-10.0%')
      expect(formatGrowthRate(-2.5)).toBe('-2.5%')
    })

    it('should format zero growth', () => {
      expect(formatGrowthRate(0)).toBe('0.0%')
    })
  })

  describe('getEngagementLevel', () => {
    it('should return correct levels', () => {
      expect(getEngagementLevel(50)).toBe('excellent')
      expect(getEngagementLevel(25)).toBe('high')
      expect(getEngagementLevel(15)).toBe('medium')
      expect(getEngagementLevel(5)).toBe('low')
    })
  })

  describe('getHealthScoreLabel', () => {
    it('should return correct labels', () => {
      expect(getHealthScoreLabel(95)).toBe('excellent')
      expect(getHealthScoreLabel(80)).toBe('good')
      expect(getHealthScoreLabel(60)).toBe('fair')
      expect(getHealthScoreLabel(30)).toBe('poor')
      expect(getHealthScoreLabel(10)).toBe('critical')
    })
  })

  describe('getHealthScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getHealthScoreColor(95)).toBe('#22c55e')
    })

    it('should return lime for good scores', () => {
      expect(getHealthScoreColor(80)).toBe('#84cc16')
    })

    it('should return yellow for fair scores', () => {
      expect(getHealthScoreColor(60)).toBe('#eab308')
    })

    it('should return orange for poor scores', () => {
      expect(getHealthScoreColor(30)).toBe('#f97316')
    })

    it('should return red for critical scores', () => {
      expect(getHealthScoreColor(10)).toBe('#ef4444')
    })
  })
})
