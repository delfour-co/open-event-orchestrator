import { describe, expect, it } from 'vitest'
import {
  type AbTestCampaign,
  type AbTestVariant,
  buildVariantStats,
  calculateBounceRate,
  calculateClickRate,
  calculateDeliveryRate,
  calculateOpenRate,
  calculateStatisticalSignificance,
  canSelectWinner,
  canStartTest,
  determineWinner,
  formatTestDuration,
  getRemainingRecipients,
  getRemainingTestTime,
  isTestDurationElapsed,
  splitRecipients,
  type VariantStats
} from './ab-testing'

describe('ab-testing', () => {
  const now = new Date()

  const createVariant = (overrides: Partial<AbTestVariant> = {}): AbTestVariant => ({
    id: 'v1',
    testId: 't1',
    name: 'A',
    subject: 'Test Subject',
    htmlContent: '<p>Test</p>',
    recipientCount: 100,
    sentCount: 100,
    deliveredCount: 95,
    openedCount: 40,
    clickedCount: 10,
    bouncedCount: 5,
    isWinner: false,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  const createTest = (overrides: Partial<AbTestCampaign> = {}): AbTestCampaign => ({
    id: 't1',
    eventId: 'evt-1',
    name: 'Test Campaign',
    testVariable: 'subject',
    winnerCriteria: 'open_rate',
    testPercentage: 20,
    testDurationHours: 24,
    status: 'draft',
    totalRecipients: 1000,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('calculateOpenRate', () => {
    it('should calculate correct open rate', () => {
      expect(calculateOpenRate(40, 100)).toBe(40)
      expect(calculateOpenRate(25, 100)).toBe(25)
    })

    it('should return 0 when no deliveries', () => {
      expect(calculateOpenRate(0, 0)).toBe(0)
    })

    it('should round to one decimal place', () => {
      expect(calculateOpenRate(33, 100)).toBe(33)
      expect(calculateOpenRate(1, 3)).toBe(33.3)
    })
  })

  describe('calculateClickRate', () => {
    it('should calculate correct click rate', () => {
      expect(calculateClickRate(10, 100)).toBe(10)
    })

    it('should return 0 when no deliveries', () => {
      expect(calculateClickRate(0, 0)).toBe(0)
    })
  })

  describe('calculateBounceRate', () => {
    it('should calculate correct bounce rate', () => {
      expect(calculateBounceRate(5, 100)).toBe(5)
    })

    it('should return 0 when no sends', () => {
      expect(calculateBounceRate(0, 0)).toBe(0)
    })
  })

  describe('calculateDeliveryRate', () => {
    it('should calculate correct delivery rate', () => {
      expect(calculateDeliveryRate(95, 100)).toBe(95)
    })

    it('should return 0 when no sends', () => {
      expect(calculateDeliveryRate(0, 0)).toBe(0)
    })
  })

  describe('buildVariantStats', () => {
    it('should build stats from variant', () => {
      const variant = createVariant()
      const stats = buildVariantStats(variant)

      expect(stats.variantId).toBe('v1')
      expect(stats.name).toBe('A')
      expect(stats.recipientCount).toBe(100)
      expect(stats.openRate).toBeCloseTo(42.1, 1) // 40/95
      expect(stats.clickRate).toBeCloseTo(10.5, 1) // 10/95
      expect(stats.bounceRate).toBe(5)
      expect(stats.deliveryRate).toBe(95)
    })
  })

  describe('determineWinner', () => {
    it('should select winner by open rate', () => {
      const variants: VariantStats[] = [
        {
          variantId: 'v1',
          name: 'A',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 40,
          clickedCount: 10,
          bouncedCount: 5,
          openRate: 42.1,
          clickRate: 10.5,
          bounceRate: 5,
          deliveryRate: 95
        },
        {
          variantId: 'v2',
          name: 'B',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 50,
          clickedCount: 8,
          bouncedCount: 5,
          openRate: 52.6,
          clickRate: 8.4,
          bounceRate: 5,
          deliveryRate: 95
        }
      ]

      const winner = determineWinner(variants, 'open_rate')

      expect(winner?.variantId).toBe('v2')
    })

    it('should select winner by click rate', () => {
      const variants: VariantStats[] = [
        {
          variantId: 'v1',
          name: 'A',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 40,
          clickedCount: 15,
          bouncedCount: 5,
          openRate: 42.1,
          clickRate: 15.8,
          bounceRate: 5,
          deliveryRate: 95
        },
        {
          variantId: 'v2',
          name: 'B',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 50,
          clickedCount: 8,
          bouncedCount: 5,
          openRate: 52.6,
          clickRate: 8.4,
          bounceRate: 5,
          deliveryRate: 95
        }
      ]

      const winner = determineWinner(variants, 'click_rate')

      expect(winner?.variantId).toBe('v1')
    })

    it('should return null for empty variants', () => {
      expect(determineWinner([], 'open_rate')).toBeNull()
    })
  })

  describe('isTestDurationElapsed', () => {
    it('should return true when duration elapsed', () => {
      const startedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago
      expect(isTestDurationElapsed(startedAt, 24)).toBe(true)
    })

    it('should return false when duration not elapsed', () => {
      const startedAt = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
      expect(isTestDurationElapsed(startedAt, 24)).toBe(false)
    })
  })

  describe('getRemainingTestTime', () => {
    it('should calculate remaining time', () => {
      const startedAt = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
      const remaining = getRemainingTestTime(startedAt, 24)
      expect(remaining).toBeCloseTo(12, 0)
    })

    it('should return 0 when elapsed', () => {
      const startedAt = new Date(now.getTime() - 30 * 60 * 60 * 1000) // 30 hours ago
      expect(getRemainingTestTime(startedAt, 24)).toBe(0)
    })
  })

  describe('calculateStatisticalSignificance', () => {
    it('should return high significance for large difference', () => {
      const significance = calculateStatisticalSignificance(50, 1000, 30, 1000)
      expect(significance).toBeGreaterThanOrEqual(95)
    })

    it('should return low significance for small difference', () => {
      const significance = calculateStatisticalSignificance(50, 100, 48, 100)
      expect(significance).toBeLessThan(80)
    })

    it('should return 0 for zero sample sizes', () => {
      expect(calculateStatisticalSignificance(50, 0, 30, 100)).toBe(0)
      expect(calculateStatisticalSignificance(50, 100, 30, 0)).toBe(0)
    })
  })

  describe('splitRecipients', () => {
    it('should split recipients into variant groups', () => {
      const recipients = Array.from({ length: 100 }, (_, i) => `r${i}`)
      const groups = splitRecipients(recipients, 20, 2)

      expect(groups.size).toBe(2)
      expect(groups.has('A')).toBe(true)
      expect(groups.has('B')).toBe(true)

      const totalTestRecipients = (groups.get('A')?.length || 0) + (groups.get('B')?.length || 0)
      expect(totalTestRecipients).toBeGreaterThanOrEqual(20)
    })

    it('should support 3 variants', () => {
      const recipients = Array.from({ length: 100 }, (_, i) => `r${i}`)
      const groups = splitRecipients(recipients, 30, 3)

      expect(groups.size).toBe(3)
      expect(groups.has('A')).toBe(true)
      expect(groups.has('B')).toBe(true)
      expect(groups.has('C')).toBe(true)
    })
  })

  describe('getRemainingRecipients', () => {
    it('should return recipients not in test groups', () => {
      const allRecipients = ['r1', 'r2', 'r3', 'r4', 'r5']
      const testGroups = new Map<'A' | 'B' | 'C', string[]>([
        ['A', ['r1']],
        ['B', ['r2']]
      ])

      const remaining = getRemainingRecipients(allRecipients, testGroups)

      expect(remaining).toHaveLength(3)
      expect(remaining).toContain('r3')
      expect(remaining).toContain('r4')
      expect(remaining).toContain('r5')
    })
  })

  describe('canStartTest', () => {
    it('should allow starting valid test', () => {
      const test = createTest({ status: 'draft', totalRecipients: 1000 })
      const result = canStartTest(test, 2)

      expect(result.can).toBe(true)
    })

    it('should reject non-draft test', () => {
      const test = createTest({ status: 'testing' })
      const result = canStartTest(test, 2)

      expect(result.can).toBe(false)
      expect(result.reason).toContain('draft')
    })

    it('should reject test with insufficient variants', () => {
      const test = createTest()
      const result = canStartTest(test, 1)

      expect(result.can).toBe(false)
      expect(result.reason).toContain('2 variants')
    })

    it('should reject test with insufficient recipients', () => {
      const test = createTest({ totalRecipients: 15 })
      const result = canStartTest(test, 2)

      expect(result.can).toBe(false)
      expect(result.reason).toContain('recipients')
    })
  })

  describe('canSelectWinner', () => {
    it('should allow selecting winner when testing', () => {
      const test = createTest({ status: 'testing' })
      expect(canSelectWinner(test)).toBe(true)
    })

    it('should not allow selecting winner when draft', () => {
      const test = createTest({ status: 'draft' })
      expect(canSelectWinner(test)).toBe(false)
    })

    it('should not allow selecting winner when completed', () => {
      const test = createTest({ status: 'completed' })
      expect(canSelectWinner(test)).toBe(false)
    })
  })

  describe('formatTestDuration', () => {
    it('should format hours', () => {
      expect(formatTestDuration(1)).toBe('1 hour')
      expect(formatTestDuration(12)).toBe('12 hours')
    })

    it('should format days', () => {
      expect(formatTestDuration(24)).toBe('1 day')
      expect(formatTestDuration(48)).toBe('2 days')
    })

    it('should format days and hours', () => {
      expect(formatTestDuration(30)).toBe('1 day 6h')
      expect(formatTestDuration(50)).toBe('2 days 2h')
    })
  })
})
