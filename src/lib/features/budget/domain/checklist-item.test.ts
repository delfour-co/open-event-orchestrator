import { describe, expect, it } from 'vitest'
import {
  budgetChecklistItemSchema,
  canCancelChecklistItem,
  canConvertToTransaction,
  canEditChecklistItem,
  checklistItemPriorities,
  checklistItemStatuses,
  createChecklistItemSchema,
  getChecklistStatusColor,
  getChecklistStatusLabel,
  getNextStatuses,
  getPriorityColor,
  getPriorityLabel,
  updateChecklistItemSchema
} from './checklist-item'

describe('BudgetChecklistItem', () => {
  const validItem = {
    id: 'item123',
    editionId: 'edition123',
    categoryId: 'cat123',
    name: 'Venue rental',
    description: 'Main conference venue',
    estimatedAmount: 500000,
    status: 'pending' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-06-01'),
    assignee: 'John Doe',
    notes: 'Contact venue manager',
    order: 0,
    transactionId: undefined,
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('budgetChecklistItemSchema', () => {
    it('should validate a valid checklist item', () => {
      const result = budgetChecklistItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should validate item with minimal fields', () => {
      const minimal = {
        id: 'item123',
        editionId: 'edition123',
        name: 'Test item',
        status: 'pending',
        priority: 'medium',
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = budgetChecklistItemSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = budgetChecklistItemSchema.safeParse({ ...validItem, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name too long', () => {
      const result = budgetChecklistItemSchema.safeParse({ ...validItem, name: 'a'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('should reject negative estimated amount', () => {
      const result = budgetChecklistItemSchema.safeParse({ ...validItem, estimatedAmount: -100 })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = budgetChecklistItemSchema.safeParse({ ...validItem, status: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid priority', () => {
      const result = budgetChecklistItemSchema.safeParse({ ...validItem, priority: 'critical' })
      expect(result.success).toBe(false)
    })
  })

  describe('createChecklistItemSchema', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        editionId: 'edition123',
        name: 'New item',
        status: 'pending' as const,
        priority: 'medium' as const,
        createdBy: 'user123'
      }
      const result = createChecklistItemSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateChecklistItemSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated name',
        status: 'approved' as const
      }
      const result = updateChecklistItemSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateChecklistItemSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('status helpers', () => {
    it('should return correct status labels', () => {
      expect(getChecklistStatusLabel('pending')).toBe('Pending')
      expect(getChecklistStatusLabel('approved')).toBe('Approved')
      expect(getChecklistStatusLabel('ordered')).toBe('Ordered')
      expect(getChecklistStatusLabel('paid')).toBe('Paid')
      expect(getChecklistStatusLabel('cancelled')).toBe('Cancelled')
    })

    it('should return correct status colors', () => {
      expect(getChecklistStatusColor('pending')).toBe('yellow')
      expect(getChecklistStatusColor('approved')).toBe('blue')
      expect(getChecklistStatusColor('ordered')).toBe('purple')
      expect(getChecklistStatusColor('paid')).toBe('green')
      expect(getChecklistStatusColor('cancelled')).toBe('gray')
    })

    it('should have labels for all statuses', () => {
      for (const status of checklistItemStatuses) {
        expect(getChecklistStatusLabel(status)).toBeDefined()
        expect(typeof getChecklistStatusLabel(status)).toBe('string')
      }
    })
  })

  describe('priority helpers', () => {
    it('should return correct priority labels', () => {
      expect(getPriorityLabel('low')).toBe('Low')
      expect(getPriorityLabel('medium')).toBe('Medium')
      expect(getPriorityLabel('high')).toBe('High')
    })

    it('should return correct priority colors', () => {
      expect(getPriorityColor('low')).toBe('gray')
      expect(getPriorityColor('medium')).toBe('yellow')
      expect(getPriorityColor('high')).toBe('red')
    })

    it('should have labels for all priorities', () => {
      for (const priority of checklistItemPriorities) {
        expect(getPriorityLabel(priority)).toBeDefined()
        expect(typeof getPriorityLabel(priority)).toBe('string')
      }
    })
  })

  describe('canEditChecklistItem', () => {
    it('should allow editing pending items', () => {
      expect(canEditChecklistItem('pending')).toBe(true)
    })

    it('should allow editing approved items', () => {
      expect(canEditChecklistItem('approved')).toBe(true)
    })

    it('should allow editing ordered items', () => {
      expect(canEditChecklistItem('ordered')).toBe(true)
    })

    it('should not allow editing paid items', () => {
      expect(canEditChecklistItem('paid')).toBe(false)
    })

    it('should not allow editing cancelled items', () => {
      expect(canEditChecklistItem('cancelled')).toBe(false)
    })
  })

  describe('canConvertToTransaction', () => {
    it('should allow conversion for approved items without transaction', () => {
      expect(canConvertToTransaction('approved', undefined)).toBe(true)
    })

    it('should not allow conversion for approved items with existing transaction', () => {
      expect(canConvertToTransaction('approved', 'trans123')).toBe(false)
    })

    it('should not allow conversion for pending items', () => {
      expect(canConvertToTransaction('pending', undefined)).toBe(false)
    })

    it('should not allow conversion for paid items', () => {
      expect(canConvertToTransaction('paid', undefined)).toBe(false)
    })
  })

  describe('canCancelChecklistItem', () => {
    it('should allow cancelling pending items', () => {
      expect(canCancelChecklistItem('pending')).toBe(true)
    })

    it('should allow cancelling approved items', () => {
      expect(canCancelChecklistItem('approved')).toBe(true)
    })

    it('should not allow cancelling paid items', () => {
      expect(canCancelChecklistItem('paid')).toBe(false)
    })

    it('should not allow cancelling already cancelled items', () => {
      expect(canCancelChecklistItem('cancelled')).toBe(false)
    })
  })

  describe('getNextStatuses', () => {
    it('should return correct transitions for pending', () => {
      const next = getNextStatuses('pending')
      expect(next).toContain('approved')
      expect(next).toContain('cancelled')
      expect(next).not.toContain('paid')
    })

    it('should return correct transitions for approved', () => {
      const next = getNextStatuses('approved')
      expect(next).toContain('ordered')
      expect(next).toContain('paid')
      expect(next).toContain('cancelled')
    })

    it('should return correct transitions for ordered', () => {
      const next = getNextStatuses('ordered')
      expect(next).toContain('paid')
      expect(next).toContain('cancelled')
    })

    it('should return empty array for paid', () => {
      expect(getNextStatuses('paid')).toHaveLength(0)
    })

    it('should allow reactivation from cancelled', () => {
      expect(getNextStatuses('cancelled')).toContain('pending')
    })
  })
})
