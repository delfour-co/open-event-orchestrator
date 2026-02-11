import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCORE_THRESHOLDS,
  type LeadScoringRule,
  applyScoreChange,
  buildScoreHistoryEntry,
  calculateInactivityDays,
  calculateLeadLevel,
  findApplicableRule,
  formatScoreChange,
  shouldApplyInactivityPenalty
} from './lead-scoring'

const createMockRule = (overrides: Partial<LeadScoringRule> = {}): LeadScoringRule => ({
  id: 'rule-1',
  eventId: 'evt-1',
  name: 'Test Rule',
  action: 'email_opened',
  points: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Lead Scoring Domain', () => {
  describe('calculateLeadLevel', () => {
    it('should return cold for low score', () => {
      expect(calculateLeadLevel(10)).toBe('cold')
      expect(calculateLeadLevel(0)).toBe('cold')
      expect(calculateLeadLevel(-10)).toBe('cold')
    })

    it('should return warm for medium score', () => {
      expect(calculateLeadLevel(20)).toBe('warm')
      expect(calculateLeadLevel(35)).toBe('warm')
      expect(calculateLeadLevel(49)).toBe('warm')
    })

    it('should return hot for high score', () => {
      expect(calculateLeadLevel(50)).toBe('hot')
      expect(calculateLeadLevel(100)).toBe('hot')
    })

    it('should use custom thresholds', () => {
      const thresholds = { warm: 10, hot: 30 }
      expect(calculateLeadLevel(5, thresholds)).toBe('cold')
      expect(calculateLeadLevel(15, thresholds)).toBe('warm')
      expect(calculateLeadLevel(40, thresholds)).toBe('hot')
    })

    it('should use default thresholds', () => {
      expect(DEFAULT_SCORE_THRESHOLDS.warm).toBe(20)
      expect(DEFAULT_SCORE_THRESHOLDS.hot).toBe(50)
    })
  })

  describe('findApplicableRule', () => {
    it('should find matching active rule', () => {
      const rules = [
        createMockRule({ id: 'r1', action: 'email_opened', isActive: true }),
        createMockRule({ id: 'r2', action: 'email_clicked', isActive: true })
      ]

      const result = findApplicableRule(rules, 'email_opened')
      expect(result?.id).toBe('r1')
    })

    it('should skip inactive rules', () => {
      const rules = [
        createMockRule({ action: 'email_opened', isActive: false }),
        createMockRule({ action: 'email_opened', isActive: true, id: 'active' })
      ]

      const result = findApplicableRule(rules, 'email_opened')
      expect(result?.id).toBe('active')
    })

    it('should return undefined for no matching rule', () => {
      const rules = [createMockRule({ action: 'email_opened' })]

      const result = findApplicableRule(rules, 'ticket_purchased')
      expect(result).toBeUndefined()
    })

    it('should find most specific inactivity rule', () => {
      const rules = [
        createMockRule({
          id: 'r30',
          action: 'inactivity',
          inactivityDays: 30,
          points: -10
        }),
        createMockRule({
          id: 'r90',
          action: 'inactivity',
          inactivityDays: 90,
          points: -25
        }),
        createMockRule({
          id: 'r180',
          action: 'inactivity',
          inactivityDays: 180,
          points: -50
        })
      ]

      // For 45 days inactive, should match 30-day rule
      expect(findApplicableRule(rules, 'inactivity', 45)?.id).toBe('r30')

      // For 100 days inactive, should match 90-day rule
      expect(findApplicableRule(rules, 'inactivity', 100)?.id).toBe('r90')

      // For 200 days inactive, should match 180-day rule
      expect(findApplicableRule(rules, 'inactivity', 200)?.id).toBe('r180')
    })
  })

  describe('applyScoreChange', () => {
    it('should add positive points', () => {
      expect(applyScoreChange(50, 10)).toBe(60)
    })

    it('should subtract negative points', () => {
      expect(applyScoreChange(50, -10)).toBe(40)
    })

    it('should handle zero', () => {
      expect(applyScoreChange(50, 0)).toBe(50)
    })
  })

  describe('formatScoreChange', () => {
    it('should format positive points with plus', () => {
      expect(formatScoreChange(10)).toBe('+10')
    })

    it('should format negative points with minus', () => {
      expect(formatScoreChange(-10)).toBe('-10')
    })

    it('should format zero', () => {
      expect(formatScoreChange(0)).toBe('0')
    })
  })

  describe('calculateInactivityDays', () => {
    it('should return 0 for undefined', () => {
      expect(calculateInactivityDays(undefined)).toBe(0)
    })

    it('should calculate days correctly', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      const days = calculateInactivityDays(tenDaysAgo)
      expect(days).toBeGreaterThanOrEqual(9)
      expect(days).toBeLessThanOrEqual(11)
    })
  })

  describe('shouldApplyInactivityPenalty', () => {
    it('should return false if no last activity', () => {
      const rule = createMockRule({ action: 'inactivity', inactivityDays: 30 })
      expect(shouldApplyInactivityPenalty(undefined, undefined, rule)).toBe(false)
    })

    it('should return false if under threshold', () => {
      const rule = createMockRule({ action: 'inactivity', inactivityDays: 30 })
      const recentActivity = new Date()
      recentActivity.setDate(recentActivity.getDate() - 15)

      expect(shouldApplyInactivityPenalty(recentActivity, undefined, rule)).toBe(false)
    })

    it('should return true if over threshold', () => {
      const rule = createMockRule({ action: 'inactivity', inactivityDays: 30 })
      const oldActivity = new Date()
      oldActivity.setDate(oldActivity.getDate() - 45)

      expect(shouldApplyInactivityPenalty(oldActivity, undefined, rule)).toBe(true)
    })

    it('should return false if penalty was applied recently', () => {
      const rule = createMockRule({ action: 'inactivity', inactivityDays: 30 })
      const oldActivity = new Date()
      oldActivity.setDate(oldActivity.getDate() - 45)

      const recentUpdate = new Date()
      recentUpdate.setDate(recentUpdate.getDate() - 3)

      expect(shouldApplyInactivityPenalty(oldActivity, recentUpdate, rule)).toBe(false)
    })
  })

  describe('buildScoreHistoryEntry', () => {
    it('should build entry with rule', () => {
      const rule = createMockRule({ id: 'r1', name: 'Email Opened', points: 5 })

      const entry = buildScoreHistoryEntry('c1', rule, 'email_opened', 5, 10)

      expect(entry.contactId).toBe('c1')
      expect(entry.ruleId).toBe('r1')
      expect(entry.action).toBe('email_opened')
      expect(entry.pointsChange).toBe(5)
      expect(entry.previousScore).toBe(10)
      expect(entry.newScore).toBe(15)
      expect(entry.description).toBe('Email Opened')
    })

    it('should build entry without rule', () => {
      const entry = buildScoreHistoryEntry(
        'c1',
        undefined,
        'manual_adjustment',
        -20,
        50,
        'Reduced due to complaint'
      )

      expect(entry.ruleId).toBeUndefined()
      expect(entry.description).toBe('Reduced due to complaint')
      expect(entry.newScore).toBe(30)
    })

    it('should include metadata', () => {
      const entry = buildScoreHistoryEntry('c1', undefined, 'custom', 10, 0, undefined, {
        reason: 'VIP customer'
      })

      expect(entry.metadata).toEqual({ reason: 'VIP customer' })
    })
  })
})
