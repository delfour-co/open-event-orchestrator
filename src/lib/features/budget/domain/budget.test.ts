import { describe, expect, it } from 'vitest'
import {
  budgetCurrencySchema,
  budgetStatusSchema,
  canEditBudget,
  createBudgetSchema,
  editionBudgetSchema,
  formatBudgetAmount,
  getBudgetStatusColor,
  getBudgetStatusLabel,
  updateBudgetSchema
} from './budget'

describe('EditionBudget', () => {
  const now = new Date()

  const validBudget = {
    id: 'bg-123',
    editionId: 'ed-456',
    totalBudget: 50000,
    currency: 'EUR' as const,
    status: 'draft' as const,
    notes: 'Conference budget for 2025',
    createdAt: now,
    updatedAt: now
  }

  describe('editionBudgetSchema', () => {
    it('should validate a valid budget', () => {
      const result = editionBudgetSchema.safeParse(validBudget)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimal = {
        id: 'bg-123',
        editionId: 'ed-456',
        totalBudget: 0,
        currency: 'EUR',
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }
      const result = editionBudgetSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject negative totalBudget', () => {
      const result = editionBudgetSchema.safeParse({ ...validBudget, totalBudget: -100 })
      expect(result.success).toBe(false)
    })

    it('should reject invalid currency', () => {
      const result = editionBudgetSchema.safeParse({ ...validBudget, currency: 'JPY' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = editionBudgetSchema.safeParse({ ...validBudget, status: 'open' })
      expect(result.success).toBe(false)
    })
  })

  describe('createBudgetSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        editionId: 'ed-456',
        totalBudget: 50000,
        currency: 'EUR',
        status: 'draft'
      }
      const result = createBudgetSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should apply default currency and status', () => {
      const createData = {
        editionId: 'ed-456',
        totalBudget: 10000
      }
      const result = createBudgetSchema.safeParse(createData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('EUR')
        expect(result.data.status).toBe('draft')
      }
    })
  })

  describe('updateBudgetSchema', () => {
    it('should validate partial update data', () => {
      const result = updateBudgetSchema.safeParse({ totalBudget: 60000 })
      expect(result.success).toBe(true)
    })

    it('should validate update with multiple fields', () => {
      const result = updateBudgetSchema.safeParse({
        totalBudget: 75000,
        currency: 'USD',
        status: 'approved',
        notes: 'Updated budget'
      })
      expect(result.success).toBe(true)
    })

    it('should validate empty update', () => {
      const result = updateBudgetSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid currency in update', () => {
      const result = updateBudgetSchema.safeParse({ currency: 'JPY' })
      expect(result.success).toBe(false)
    })
  })

  describe('budgetCurrencySchema', () => {
    it('should accept EUR', () => {
      expect(budgetCurrencySchema.safeParse('EUR').success).toBe(true)
    })

    it('should accept USD', () => {
      expect(budgetCurrencySchema.safeParse('USD').success).toBe(true)
    })

    it('should accept GBP', () => {
      expect(budgetCurrencySchema.safeParse('GBP').success).toBe(true)
    })

    it('should reject unsupported currency', () => {
      expect(budgetCurrencySchema.safeParse('JPY').success).toBe(false)
      expect(budgetCurrencySchema.safeParse('CHF').success).toBe(false)
    })
  })

  describe('budgetStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['draft', 'approved', 'closed']
      for (const status of statuses) {
        const result = budgetStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      const result = budgetStatusSchema.safeParse('active')
      expect(result.success).toBe(false)
    })
  })

  describe('getBudgetStatusLabel', () => {
    it('should return correct label for draft', () => {
      expect(getBudgetStatusLabel('draft')).toBe('Draft')
    })

    it('should return correct label for approved', () => {
      expect(getBudgetStatusLabel('approved')).toBe('Approved')
    })

    it('should return correct label for closed', () => {
      expect(getBudgetStatusLabel('closed')).toBe('Closed')
    })
  })

  describe('getBudgetStatusColor', () => {
    it('should return yellow for draft', () => {
      expect(getBudgetStatusColor('draft')).toBe('yellow')
    })

    it('should return green for approved', () => {
      expect(getBudgetStatusColor('approved')).toBe('green')
    })

    it('should return gray for closed', () => {
      expect(getBudgetStatusColor('closed')).toBe('gray')
    })
  })

  describe('canEditBudget', () => {
    it('should allow editing draft budget', () => {
      expect(canEditBudget('draft')).toBe(true)
    })

    it('should allow editing approved budget', () => {
      expect(canEditBudget('approved')).toBe(true)
    })

    it('should not allow editing closed budget', () => {
      expect(canEditBudget('closed')).toBe(false)
    })
  })

  describe('formatBudgetAmount', () => {
    it('should format EUR amount', () => {
      const formatted = formatBudgetAmount(50000, 'EUR')
      expect(formatted).toContain('50')
      expect(formatted).toContain('000')
      expect(formatted).toContain('€')
    })

    it('should format zero amount', () => {
      const formatted = formatBudgetAmount(0, 'EUR')
      expect(formatted).toContain('0')
    })

    it('should format USD amount', () => {
      const formatted = formatBudgetAmount(25000, 'USD')
      expect(formatted).toContain('25')
      expect(formatted).toContain('$')
    })
  })
})
