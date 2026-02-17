import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BUDGET_TEMPLATES,
  budgetTemplateSchema,
  calculateTemplateTotal,
  createBudgetTemplateSchema,
  eventTypes,
  getEventTypeIcon,
  getEventTypeLabel,
  templateItemSchema,
  updateBudgetTemplateSchema
} from './budget-template'

describe('BudgetTemplate', () => {
  const validTemplate = {
    id: 'template123',
    name: 'Conference Budget',
    description: 'Standard conference budget template',
    eventType: 'conference' as const,
    isGlobal: true,
    organizationId: undefined,
    items: [
      {
        name: 'Venue',
        category: 'venue',
        estimatedAmount: 500000,
        priority: 'high' as const,
        isVariable: false
      },
      {
        name: 'Catering',
        category: 'catering',
        estimatedAmount: 3000,
        priority: 'medium' as const,
        isVariable: true,
        variableUnit: 'attendee'
      }
    ],
    usageCount: 5,
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('templateItemSchema', () => {
    it('should validate a valid template item', () => {
      const item = { name: 'Venue rental', estimatedAmount: 500000, priority: 'high' }
      const result = templateItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    })

    it('should validate variable item with unit', () => {
      const item = {
        name: 'Catering',
        estimatedAmount: 2500,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      }
      const result = templateItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const item = { name: '', estimatedAmount: 1000, priority: 'low' }
      const result = templateItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const item = { name: 'Test', estimatedAmount: -100, priority: 'low' }
      const result = templateItemSchema.safeParse(item)
      expect(result.success).toBe(false)
    })
  })

  describe('budgetTemplateSchema', () => {
    it('should validate a valid template', () => {
      const result = budgetTemplateSchema.safeParse(validTemplate)
      expect(result.success).toBe(true)
    })

    it('should validate template with minimal fields', () => {
      const minimal = {
        id: 'template123',
        name: 'Test Template',
        eventType: 'meetup',
        items: [],
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = budgetTemplateSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = budgetTemplateSchema.safeParse({ ...validTemplate, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid event type', () => {
      const result = budgetTemplateSchema.safeParse({ ...validTemplate, eventType: 'festival' })
      expect(result.success).toBe(false)
    })

    it('should accept all valid event types', () => {
      for (const eventType of eventTypes) {
        const result = budgetTemplateSchema.safeParse({ ...validTemplate, eventType })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('createBudgetTemplateSchema', () => {
    it('should validate create data without id and usageCount', () => {
      const createData = {
        name: 'New Template',
        eventType: 'workshop' as const,
        items: [],
        createdBy: 'user123'
      }
      const result = createBudgetTemplateSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateBudgetTemplateSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated Template Name',
        description: 'New description'
      }
      const result = updateBudgetTemplateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow updating items', () => {
      const updateData = {
        items: [
          { name: 'New item', estimatedAmount: 1000, priority: 'low' as const, isVariable: false }
        ]
      }
      const result = updateBudgetTemplateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('getEventTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getEventTypeLabel('conference')).toBe('Conference')
      expect(getEventTypeLabel('meetup')).toBe('Meetup')
      expect(getEventTypeLabel('workshop')).toBe('Workshop')
      expect(getEventTypeLabel('hackathon')).toBe('Hackathon')
      expect(getEventTypeLabel('other')).toBe('Other')
    })

    it('should have labels for all event types', () => {
      for (const eventType of eventTypes) {
        expect(getEventTypeLabel(eventType)).toBeDefined()
        expect(typeof getEventTypeLabel(eventType)).toBe('string')
      }
    })
  })

  describe('getEventTypeIcon', () => {
    it('should return correct icons', () => {
      expect(getEventTypeIcon('conference')).toBe('presentation')
      expect(getEventTypeIcon('meetup')).toBe('users')
      expect(getEventTypeIcon('workshop')).toBe('wrench')
      expect(getEventTypeIcon('hackathon')).toBe('code')
      expect(getEventTypeIcon('other')).toBe('calendar')
    })

    it('should have icons for all event types', () => {
      for (const eventType of eventTypes) {
        expect(getEventTypeIcon(eventType)).toBeDefined()
        expect(typeof getEventTypeIcon(eventType)).toBe('string')
      }
    })
  })

  describe('calculateTemplateTotal', () => {
    it('should calculate total of all items', () => {
      const items = [
        { name: 'A', estimatedAmount: 100000, priority: 'low' as const, isVariable: false },
        { name: 'B', estimatedAmount: 200000, priority: 'medium' as const, isVariable: false },
        { name: 'C', estimatedAmount: 50000, priority: 'high' as const, isVariable: false }
      ]
      expect(calculateTemplateTotal(items)).toBe(350000)
    })

    it('should return 0 for empty items', () => {
      expect(calculateTemplateTotal([])).toBe(0)
    })

    it('should handle single item', () => {
      const items = [
        { name: 'Single', estimatedAmount: 123456, priority: 'medium' as const, isVariable: false }
      ]
      expect(calculateTemplateTotal(items)).toBe(123456)
    })
  })

  describe('DEFAULT_BUDGET_TEMPLATES', () => {
    it('should have at least 3 default templates', () => {
      expect(DEFAULT_BUDGET_TEMPLATES.length).toBeGreaterThanOrEqual(3)
    })

    it('should have valid event types for all templates', () => {
      for (const template of DEFAULT_BUDGET_TEMPLATES) {
        expect(eventTypes).toContain(template.eventType)
      }
    })

    it('should have items in each template', () => {
      for (const template of DEFAULT_BUDGET_TEMPLATES) {
        expect(template.items.length).toBeGreaterThan(0)
      }
    })

    it('should have global templates', () => {
      for (const template of DEFAULT_BUDGET_TEMPLATES) {
        expect(template.isGlobal).toBe(true)
      }
    })

    it('should have valid items in templates', () => {
      for (const template of DEFAULT_BUDGET_TEMPLATES) {
        for (const item of template.items) {
          const result = templateItemSchema.safeParse(item)
          expect(result.success).toBe(true)
        }
      }
    })

    it('should have variable items with units', () => {
      const allVariableItems = DEFAULT_BUDGET_TEMPLATES.flatMap((t) => t.items).filter(
        (i) => i.isVariable
      )
      expect(allVariableItems.length).toBeGreaterThan(0)
      for (const item of allVariableItems) {
        expect(item.variableUnit).toBeDefined()
      }
    })
  })
})
