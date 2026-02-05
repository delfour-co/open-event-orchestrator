import { describe, expect, it } from 'vitest'
import {
  RULE_FIELD_LABELS,
  RULE_OPERATOR_LABELS,
  isSegmentDynamic,
  segmentHasRules
} from './segment'
import type { Segment } from './segment'

describe('Segment', () => {
  const now = new Date()

  const makeSegment = (overrides: Partial<Segment> = {}): Segment => ({
    id: 'seg-001',
    eventId: 'evt-001',
    name: 'VIP Speakers',
    criteria: { match: 'all', rules: [] },
    isStatic: false,
    contactCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('isSegmentDynamic', () => {
    it('should return true when isStatic is false', () => {
      const segment = makeSegment({ isStatic: false })
      expect(isSegmentDynamic(segment)).toBe(true)
    })

    it('should return false when isStatic is true', () => {
      const segment = makeSegment({ isStatic: true })
      expect(isSegmentDynamic(segment)).toBe(false)
    })
  })

  describe('segmentHasRules', () => {
    it('should return true when rules array is non-empty', () => {
      const segment = makeSegment({
        criteria: {
          match: 'all',
          rules: [{ field: 'source', operator: 'equals', value: 'speaker' }]
        }
      })
      expect(segmentHasRules(segment)).toBe(true)
    })

    it('should return false when rules array is empty', () => {
      const segment = makeSegment({ criteria: { match: 'all', rules: [] } })
      expect(segmentHasRules(segment)).toBe(false)
    })
  })

  describe('RULE_FIELD_LABELS', () => {
    it('should have all field labels', () => {
      const expectedFields = [
        'source',
        'tags',
        'company',
        'city',
        'country',
        'edition_role',
        'edition_id',
        'consent_marketing',
        'has_checked_in'
      ]
      expect(Object.keys(RULE_FIELD_LABELS)).toHaveLength(expectedFields.length)
      for (const field of expectedFields) {
        expect(RULE_FIELD_LABELS).toHaveProperty(field)
      }
    })

    it('should have correct label values', () => {
      expect(RULE_FIELD_LABELS.source).toBe('Source')
      expect(RULE_FIELD_LABELS.tags).toBe('Tags')
      expect(RULE_FIELD_LABELS.edition_role).toBe('Edition Role')
      expect(RULE_FIELD_LABELS.has_checked_in).toBe('Has Checked In')
    })
  })

  describe('RULE_OPERATOR_LABELS', () => {
    it('should have all operator labels', () => {
      const expectedOperators = [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'is_empty',
        'is_not_empty',
        'in',
        'not_in'
      ]
      expect(Object.keys(RULE_OPERATOR_LABELS)).toHaveLength(expectedOperators.length)
      for (const op of expectedOperators) {
        expect(RULE_OPERATOR_LABELS).toHaveProperty(op)
      }
    })

    it('should have correct operator label values', () => {
      expect(RULE_OPERATOR_LABELS.equals).toBe('equals')
      expect(RULE_OPERATOR_LABELS.not_equals).toBe('does not equal')
      expect(RULE_OPERATOR_LABELS.contains).toBe('contains')
      expect(RULE_OPERATOR_LABELS.in).toBe('is one of')
    })
  })
})
