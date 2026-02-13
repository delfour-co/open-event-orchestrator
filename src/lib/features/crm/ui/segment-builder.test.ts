import {
  RULE_FIELD_LABELS,
  RULE_OPERATOR_LABELS,
  type SegmentCriteria,
  type SegmentRule,
  type SegmentRuleField,
  type SegmentRuleOperator
} from '$lib/features/crm/domain/segment'
import { describe, expect, it } from 'vitest'

describe('Segment Builder Helpers', () => {
  describe('RULE_FIELD_LABELS', () => {
    it('should have labels for all fields', () => {
      const fields: SegmentRuleField[] = [
        'source',
        'tags',
        'company',
        'city',
        'country',
        'edition_role',
        'edition_id',
        'consent_marketing',
        'has_checked_in',
        'email_opened',
        'email_clicked',
        'email_opened_any',
        'email_clicked_any',
        'has_purchased',
        'purchase_total_gte',
        'purchased_ticket_type',
        'cfp_submitted',
        'cfp_accepted',
        'cfp_rejected'
      ]

      for (const field of fields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
        expect(typeof RULE_FIELD_LABELS[field]).toBe('string')
        expect(RULE_FIELD_LABELS[field].length).toBeGreaterThan(0)
      }
    })

    it('should have human-readable labels', () => {
      expect(RULE_FIELD_LABELS.source).toBe('Source')
      expect(RULE_FIELD_LABELS.consent_marketing).toBe('Marketing Consent')
      expect(RULE_FIELD_LABELS.has_checked_in).toBe('Has Checked In')
      expect(RULE_FIELD_LABELS.purchase_total_gte).toBe('Total Purchases ≥')
    })
  })

  describe('RULE_OPERATOR_LABELS', () => {
    it('should have labels for all operators', () => {
      const operators: SegmentRuleOperator[] = [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'is_empty',
        'is_not_empty',
        'in',
        'not_in'
      ]

      for (const op of operators) {
        expect(RULE_OPERATOR_LABELS[op]).toBeDefined()
        expect(typeof RULE_OPERATOR_LABELS[op]).toBe('string')
      }
    })

    it('should have human-readable labels', () => {
      expect(RULE_OPERATOR_LABELS.equals).toBe('equals')
      expect(RULE_OPERATOR_LABELS.not_equals).toBe('does not equal')
      expect(RULE_OPERATOR_LABELS.contains).toBe('contains')
      expect(RULE_OPERATOR_LABELS.is_empty).toBe('is empty')
      expect(RULE_OPERATOR_LABELS.in).toBe('is one of')
    })
  })

  describe('SegmentRule structure', () => {
    it('should create valid rule for text field', () => {
      const rule: SegmentRule = {
        field: 'source',
        operator: 'equals',
        value: 'speaker'
      }

      expect(rule.field).toBe('source')
      expect(rule.operator).toBe('equals')
      expect(rule.value).toBe('speaker')
    })

    it('should create valid rule for boolean field', () => {
      const rule: SegmentRule = {
        field: 'has_checked_in',
        operator: 'equals',
        value: true
      }

      expect(rule.field).toBe('has_checked_in')
      expect(rule.value).toBe(true)
    })

    it('should create valid rule without value', () => {
      const rule: SegmentRule = {
        field: 'tags',
        operator: 'is_empty',
        value: undefined
      }

      expect(rule.value).toBeUndefined()
    })

    it('should create valid rule with array value', () => {
      const rule: SegmentRule = {
        field: 'source',
        operator: 'in',
        value: ['speaker', 'sponsor']
      }

      expect(Array.isArray(rule.value)).toBe(true)
    })
  })

  describe('SegmentCriteria structure', () => {
    it('should create valid criteria with all match', () => {
      const criteria: SegmentCriteria = {
        match: 'all',
        rules: [
          { field: 'source', operator: 'equals', value: 'speaker' },
          { field: 'has_checked_in', operator: 'equals', value: true }
        ]
      }

      expect(criteria.match).toBe('all')
      expect(criteria.rules.length).toBe(2)
    })

    it('should create valid criteria with any match', () => {
      const criteria: SegmentCriteria = {
        match: 'any',
        rules: [{ field: 'city', operator: 'equals', value: 'Paris' }]
      }

      expect(criteria.match).toBe('any')
    })

    it('should create empty criteria', () => {
      const criteria: SegmentCriteria = {
        match: 'all',
        rules: []
      }

      expect(criteria.rules.length).toBe(0)
    })
  })

  describe('Field categories', () => {
    it('should categorize contact profile fields', () => {
      const contactFields: SegmentRuleField[] = ['source', 'tags', 'company', 'city', 'country']
      for (const field of contactFields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
      }
    })

    it('should categorize edition fields', () => {
      const editionFields: SegmentRuleField[] = [
        'edition_role',
        'edition_id',
        'consent_marketing',
        'has_checked_in'
      ]
      for (const field of editionFields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
      }
    })

    it('should categorize email behavior fields', () => {
      const emailFields: SegmentRuleField[] = [
        'email_opened',
        'email_clicked',
        'email_opened_any',
        'email_clicked_any'
      ]
      for (const field of emailFields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
      }
    })

    it('should categorize purchase fields', () => {
      const purchaseFields: SegmentRuleField[] = [
        'has_purchased',
        'purchase_total_gte',
        'purchased_ticket_type'
      ]
      for (const field of purchaseFields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
      }
    })

    it('should categorize CFP fields', () => {
      const cfpFields: SegmentRuleField[] = ['cfp_submitted', 'cfp_accepted', 'cfp_rejected']
      for (const field of cfpFields) {
        expect(RULE_FIELD_LABELS[field]).toBeDefined()
      }
    })
  })

  describe('Operator applicability', () => {
    it('should identify no-value operators', () => {
      const noValueOperators: SegmentRuleOperator[] = ['is_empty', 'is_not_empty']
      for (const op of noValueOperators) {
        expect(RULE_OPERATOR_LABELS[op]).toBeDefined()
      }
    })

    it('should identify comparison operators', () => {
      const comparisonOperators: SegmentRuleOperator[] = [
        'equals',
        'not_equals',
        'contains',
        'not_contains'
      ]
      for (const op of comparisonOperators) {
        expect(RULE_OPERATOR_LABELS[op]).toBeDefined()
      }
    })

    it('should identify list operators', () => {
      const listOperators: SegmentRuleOperator[] = ['in', 'not_in']
      for (const op of listOperators) {
        expect(RULE_OPERATOR_LABELS[op]).toBeDefined()
      }
    })
  })

  describe('JSON serialization', () => {
    it('should serialize criteria to JSON', () => {
      const criteria: SegmentCriteria = {
        match: 'all',
        rules: [
          { field: 'source', operator: 'equals', value: 'speaker' },
          { field: 'has_checked_in', operator: 'equals', value: true }
        ]
      }

      const json = JSON.stringify(criteria)
      const parsed = JSON.parse(json) as SegmentCriteria

      expect(parsed.match).toBe('all')
      expect(parsed.rules.length).toBe(2)
      expect(parsed.rules[0].field).toBe('source')
      expect(parsed.rules[1].value).toBe(true)
    })

    it('should handle empty rules', () => {
      const criteria: SegmentCriteria = {
        match: 'any',
        rules: []
      }

      const json = JSON.stringify(criteria)
      const parsed = JSON.parse(json) as SegmentCriteria

      expect(parsed.rules).toEqual([])
    })
  })
})
