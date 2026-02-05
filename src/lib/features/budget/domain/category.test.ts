import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATEGORIES,
  budgetCategorySchema,
  createCategorySchema,
  updateCategorySchema
} from './category'

describe('BudgetCategory', () => {
  const now = new Date()

  const validCategory = {
    id: 'cat-123',
    budgetId: 'bg-456',
    name: 'Venue',
    plannedAmount: 15000,
    notes: 'Main conference venue rental',
    createdAt: now,
    updatedAt: now
  }

  describe('budgetCategorySchema', () => {
    it('should validate a valid category', () => {
      const result = budgetCategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimal = {
        id: 'cat-123',
        budgetId: 'bg-456',
        name: 'Custom',
        createdAt: now,
        updatedAt: now
      }
      const result = budgetCategorySchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = budgetCategorySchema.safeParse({ ...validCategory, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding max length', () => {
      const result = budgetCategorySchema.safeParse({
        ...validCategory,
        name: 'a'.repeat(201)
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative plannedAmount', () => {
      const result = budgetCategorySchema.safeParse({
        ...validCategory,
        plannedAmount: -100
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createCategorySchema', () => {
    it('should validate creation data', () => {
      const createData = {
        budgetId: 'bg-456',
        name: 'Catering',
        plannedAmount: 8000
      }
      const result = createCategorySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should apply default plannedAmount of 0', () => {
      const createData = {
        budgetId: 'bg-456',
        name: 'Misc'
      }
      const result = createCategorySchema.safeParse(createData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.plannedAmount).toBe(0)
      }
    })
  })

  describe('updateCategorySchema', () => {
    it('should validate partial update data', () => {
      const result = updateCategorySchema.safeParse({ name: 'Updated Name' })
      expect(result.success).toBe(true)
    })

    it('should validate update with multiple fields', () => {
      const result = updateCategorySchema.safeParse({
        name: 'New Name',
        plannedAmount: 5000,
        notes: 'Updated notes'
      })
      expect(result.success).toBe(true)
    })

    it('should validate empty update', () => {
      const result = updateCategorySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject empty name in update', () => {
      const result = updateCategorySchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject negative plannedAmount in update', () => {
      const result = updateCategorySchema.safeParse({ plannedAmount: -50 })
      expect(result.success).toBe(false)
    })
  })

  describe('DEFAULT_CATEGORIES', () => {
    it('should contain 7 categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(7)
    })

    it('should contain expected category names', () => {
      expect(DEFAULT_CATEGORIES).toContain('Venue')
      expect(DEFAULT_CATEGORIES).toContain('Catering')
      expect(DEFAULT_CATEGORIES).toContain('Speakers')
      expect(DEFAULT_CATEGORIES).toContain('Marketing')
      expect(DEFAULT_CATEGORIES).toContain('Equipment')
      expect(DEFAULT_CATEGORIES).toContain('Staff')
      expect(DEFAULT_CATEGORIES).toContain('Other')
    })
  })
})
