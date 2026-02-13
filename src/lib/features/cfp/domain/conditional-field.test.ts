import { describe, expect, it } from 'vitest'
import {
  CONDITION_OPERATOR_LABELS,
  type FieldCondition,
  type FieldConditionRule,
  NO_VALUE_OPERATORS,
  evaluateCondition,
  evaluateRule,
  getVisibleFields,
  shouldShowField,
  validateVisibleFields
} from './conditional-field'

describe('Conditional Field Domain', () => {
  describe('evaluateCondition', () => {
    it('should evaluate equals operator', () => {
      const condition: FieldCondition = {
        fieldId: 'formatId',
        operator: 'equals',
        value: 'workshop'
      }

      expect(evaluateCondition(condition, { formatId: 'workshop' })).toBe(true)
      expect(evaluateCondition(condition, { formatId: 'talk' })).toBe(false)
      expect(evaluateCondition(condition, {})).toBe(false)
    })

    it('should evaluate not_equals operator', () => {
      const condition: FieldCondition = {
        fieldId: 'level',
        operator: 'not_equals',
        value: 'beginner'
      }

      expect(evaluateCondition(condition, { level: 'advanced' })).toBe(true)
      expect(evaluateCondition(condition, { level: 'beginner' })).toBe(false)
    })

    it('should evaluate contains operator for strings', () => {
      const condition: FieldCondition = {
        fieldId: 'title',
        operator: 'contains',
        value: 'react'
      }

      expect(evaluateCondition(condition, { title: 'Building with React' })).toBe(true)
      expect(evaluateCondition(condition, { title: 'REACT Basics' })).toBe(true) // case insensitive
      expect(evaluateCondition(condition, { title: 'Vue.js Guide' })).toBe(false)
    })

    it('should evaluate contains operator for arrays', () => {
      const condition: FieldCondition = {
        fieldId: 'tags',
        operator: 'contains',
        value: 'javascript'
      }

      expect(evaluateCondition(condition, { tags: ['javascript', 'typescript'] })).toBe(true)
      expect(evaluateCondition(condition, { tags: ['python', 'go'] })).toBe(false)
    })

    it('should evaluate not_contains operator', () => {
      const condition: FieldCondition = {
        fieldId: 'title',
        operator: 'not_contains',
        value: 'deprecated'
      }

      expect(evaluateCondition(condition, { title: 'Modern APIs' })).toBe(true)
      expect(evaluateCondition(condition, { title: 'Deprecated features' })).toBe(false)
    })

    it('should evaluate is_empty operator', () => {
      const condition: FieldCondition = {
        fieldId: 'notes',
        operator: 'is_empty'
      }

      expect(evaluateCondition(condition, {})).toBe(true)
      expect(evaluateCondition(condition, { notes: undefined })).toBe(true)
      expect(evaluateCondition(condition, { notes: null })).toBe(true)
      expect(evaluateCondition(condition, { notes: '' })).toBe(true)
      expect(evaluateCondition(condition, { notes: [] })).toBe(true)
      expect(evaluateCondition(condition, { notes: 'Something' })).toBe(false)
    })

    it('should evaluate is_not_empty operator', () => {
      const condition: FieldCondition = {
        fieldId: 'description',
        operator: 'is_not_empty'
      }

      expect(evaluateCondition(condition, { description: 'Hello' })).toBe(true)
      expect(evaluateCondition(condition, { description: ['item'] })).toBe(true)
      expect(evaluateCondition(condition, {})).toBe(false)
      expect(evaluateCondition(condition, { description: '' })).toBe(false)
    })

    it('should evaluate in operator', () => {
      const condition: FieldCondition = {
        fieldId: 'level',
        operator: 'in',
        value: ['intermediate', 'advanced']
      }

      expect(evaluateCondition(condition, { level: 'advanced' })).toBe(true)
      expect(evaluateCondition(condition, { level: 'intermediate' })).toBe(true)
      expect(evaluateCondition(condition, { level: 'beginner' })).toBe(false)
    })

    it('should evaluate not_in operator', () => {
      const condition: FieldCondition = {
        fieldId: 'status',
        operator: 'not_in',
        value: ['rejected', 'cancelled']
      }

      expect(evaluateCondition(condition, { status: 'pending' })).toBe(true)
      expect(evaluateCondition(condition, { status: 'rejected' })).toBe(false)
    })
  })

  describe('evaluateRule', () => {
    const baseRule: Omit<FieldConditionRule, 'conditions' | 'conditionLogic'> = {
      id: 'rule-1',
      editionId: 'edition-1',
      targetFieldId: 'duration',
      name: 'Show duration for workshops',
      isActive: true,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should evaluate AND logic (all conditions must pass)', () => {
      const rule: FieldConditionRule = {
        ...baseRule,
        conditions: [
          { fieldId: 'formatId', operator: 'equals', value: 'workshop' },
          { fieldId: 'level', operator: 'equals', value: 'advanced' }
        ],
        conditionLogic: 'AND'
      }

      expect(evaluateRule(rule, { formatId: 'workshop', level: 'advanced' })).toBe(true)
      expect(evaluateRule(rule, { formatId: 'workshop', level: 'beginner' })).toBe(false)
      expect(evaluateRule(rule, { formatId: 'talk', level: 'advanced' })).toBe(false)
    })

    it('should evaluate OR logic (any condition can pass)', () => {
      const rule: FieldConditionRule = {
        ...baseRule,
        conditions: [
          { fieldId: 'formatId', operator: 'equals', value: 'workshop' },
          { fieldId: 'formatId', operator: 'equals', value: 'hands-on' }
        ],
        conditionLogic: 'OR'
      }

      expect(evaluateRule(rule, { formatId: 'workshop' })).toBe(true)
      expect(evaluateRule(rule, { formatId: 'hands-on' })).toBe(true)
      expect(evaluateRule(rule, { formatId: 'talk' })).toBe(false)
    })

    it('should return true for inactive rules', () => {
      const rule: FieldConditionRule = {
        ...baseRule,
        isActive: false,
        conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
        conditionLogic: 'AND'
      }

      expect(evaluateRule(rule, { formatId: 'talk' })).toBe(true)
    })
  })

  describe('shouldShowField', () => {
    const createRule = (
      targetFieldId: string,
      conditions: FieldCondition[]
    ): FieldConditionRule => ({
      id: `rule-${targetFieldId}`,
      editionId: 'edition-1',
      targetFieldId,
      name: `Rule for ${targetFieldId}`,
      conditions,
      conditionLogic: 'AND',
      isActive: true,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    it('should show field when no rules apply', () => {
      const rules: FieldConditionRule[] = []
      expect(shouldShowField('title', rules, {})).toBe(true)
    })

    it('should show field when rule conditions are met', () => {
      const rules = [
        createRule('duration', [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }])
      ]

      expect(shouldShowField('duration', rules, { formatId: 'workshop' })).toBe(true)
    })

    it('should hide field when rule conditions are not met', () => {
      const rules = [
        createRule('duration', [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }])
      ]

      expect(shouldShowField('duration', rules, { formatId: 'talk' })).toBe(false)
    })

    it('should require all applicable rules to pass', () => {
      const rules = [
        createRule('prerequisites', [{ fieldId: 'level', operator: 'equals', value: 'advanced' }]),
        createRule('prerequisites', [
          { fieldId: 'formatId', operator: 'equals', value: 'workshop' }
        ])
      ]

      // Both rules apply to 'prerequisites' - both must pass
      expect(
        shouldShowField('prerequisites', rules, { level: 'advanced', formatId: 'workshop' })
      ).toBe(true)
      expect(shouldShowField('prerequisites', rules, { level: 'advanced', formatId: 'talk' })).toBe(
        false
      )
    })
  })

  describe('getVisibleFields', () => {
    it('should return all fields when no rules exist', () => {
      const allFields = ['title', 'abstract', 'duration', 'prerequisites']
      const visible = getVisibleFields(allFields, [], {})
      expect(visible).toEqual(allFields)
    })

    it('should filter fields based on conditions', () => {
      const allFields = ['title', 'abstract', 'duration', 'prerequisites']
      const rules: FieldConditionRule[] = [
        {
          id: 'rule-1',
          editionId: 'edition-1',
          targetFieldId: 'duration',
          name: 'Workshop duration',
          conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
          conditionLogic: 'AND',
          isActive: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const visibleForWorkshop = getVisibleFields(allFields, rules, { formatId: 'workshop' })
      expect(visibleForWorkshop).toContain('duration')

      const visibleForTalk = getVisibleFields(allFields, rules, { formatId: 'talk' })
      expect(visibleForTalk).not.toContain('duration')
      expect(visibleForTalk).toContain('title')
      expect(visibleForTalk).toContain('abstract')
    })
  })

  describe('validateVisibleFields', () => {
    const rules: FieldConditionRule[] = [
      {
        id: 'rule-1',
        editionId: 'edition-1',
        targetFieldId: 'duration',
        name: 'Workshop duration',
        conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
        conditionLogic: 'AND',
        isActive: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should pass when all required visible fields have values', () => {
      const result = validateVisibleFields(
        { formatId: 'workshop', title: 'My Workshop', duration: '120' },
        rules,
        ['title', 'duration']
      )
      expect(result.valid).toBe(true)
      expect(result.missingFields).toEqual([])
    })

    it('should fail when required visible field is empty', () => {
      const result = validateVisibleFields(
        { formatId: 'workshop', title: 'My Workshop', duration: '' },
        rules,
        ['title', 'duration']
      )
      expect(result.valid).toBe(false)
      expect(result.missingFields).toContain('duration')
    })

    it('should not require hidden fields', () => {
      const result = validateVisibleFields(
        { formatId: 'talk', title: 'My Talk' }, // duration is hidden for talks
        rules,
        ['title', 'duration']
      )
      expect(result.valid).toBe(true)
      expect(result.missingFields).toEqual([])
    })
  })

  describe('Constants', () => {
    it('should have labels for all operators', () => {
      const operators = [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'is_empty',
        'is_not_empty',
        'in',
        'not_in'
      ] as const

      for (const op of operators) {
        expect(CONDITION_OPERATOR_LABELS[op]).toBeDefined()
        expect(typeof CONDITION_OPERATOR_LABELS[op]).toBe('string')
      }
    })

    it('should identify no-value operators', () => {
      expect(NO_VALUE_OPERATORS).toContain('is_empty')
      expect(NO_VALUE_OPERATORS).toContain('is_not_empty')
      expect(NO_VALUE_OPERATORS).not.toContain('equals')
    })
  })
})
