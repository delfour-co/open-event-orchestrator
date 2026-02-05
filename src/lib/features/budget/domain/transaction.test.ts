import { describe, expect, it } from 'vitest'
import {
  budgetTransactionSchema,
  createTransactionSchema,
  formatAmount,
  getTransactionStatusColor,
  getTransactionStatusLabel,
  isExpense,
  transactionStatusSchema,
  transactionTypeSchema,
  updateTransactionSchema
} from './transaction'

describe('BudgetTransaction', () => {
  const now = new Date()

  const validTransaction = {
    id: 'tx-123',
    categoryId: 'cat-456',
    type: 'expense' as const,
    amount: 5000,
    description: 'Venue deposit payment',
    vendor: 'Palais des Congres',
    invoiceNumber: 'INV-2025-001',
    date: now,
    status: 'paid' as const,
    createdAt: now,
    updatedAt: now
  }

  describe('budgetTransactionSchema', () => {
    it('should validate a valid transaction', () => {
      const result = budgetTransactionSchema.safeParse(validTransaction)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimal = {
        id: 'tx-123',
        categoryId: 'cat-456',
        type: 'expense',
        amount: 100,
        description: 'Test',
        date: now,
        createdAt: now,
        updatedAt: now
      }
      const result = budgetTransactionSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const result = budgetTransactionSchema.safeParse({
        ...validTransaction,
        amount: -100
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty description', () => {
      const result = budgetTransactionSchema.safeParse({
        ...validTransaction,
        description: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid type', () => {
      const result = budgetTransactionSchema.safeParse({
        ...validTransaction,
        type: 'refund'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = budgetTransactionSchema.safeParse({
        ...validTransaction,
        status: 'completed'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createTransactionSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        categoryId: 'cat-456',
        type: 'expense',
        amount: 3000,
        description: 'Catering order',
        vendor: 'Food Corp',
        date: now,
        status: 'pending'
      }
      const result = createTransactionSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateTransactionSchema', () => {
    it('should validate partial update data', () => {
      const result = updateTransactionSchema.safeParse({ amount: 7500 })
      expect(result.success).toBe(true)
    })

    it('should validate update with multiple fields', () => {
      const result = updateTransactionSchema.safeParse({
        type: 'income',
        amount: 10000,
        description: 'Sponsorship payment',
        vendor: 'TechCorp',
        status: 'paid'
      })
      expect(result.success).toBe(true)
    })

    it('should validate empty update', () => {
      const result = updateTransactionSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid type in update', () => {
      const result = updateTransactionSchema.safeParse({ type: 'refund' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status in update', () => {
      const result = updateTransactionSchema.safeParse({ status: 'completed' })
      expect(result.success).toBe(false)
    })
  })

  describe('transactionTypeSchema', () => {
    it('should accept expense', () => {
      expect(transactionTypeSchema.safeParse('expense').success).toBe(true)
    })

    it('should accept income', () => {
      expect(transactionTypeSchema.safeParse('income').success).toBe(true)
    })

    it('should reject invalid type', () => {
      expect(transactionTypeSchema.safeParse('transfer').success).toBe(false)
    })
  })

  describe('transactionStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['pending', 'paid', 'cancelled']
      for (const status of statuses) {
        expect(transactionStatusSchema.safeParse(status).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(transactionStatusSchema.safeParse('processing').success).toBe(false)
    })
  })

  describe('formatAmount', () => {
    it('should format EUR amount', () => {
      const formatted = formatAmount(5000, 'EUR')
      expect(formatted).toContain('5')
      expect(formatted).toContain('000')
      expect(formatted).toContain('€')
    })

    it('should format zero amount', () => {
      const formatted = formatAmount(0, 'EUR')
      expect(formatted).toContain('0')
    })

    it('should format USD amount', () => {
      const formatted = formatAmount(2500, 'USD')
      expect(formatted).toContain('2')
      expect(formatted).toContain('500')
      expect(formatted).toContain('$')
    })
  })

  describe('isExpense', () => {
    it('should return true for expense', () => {
      expect(isExpense('expense')).toBe(true)
    })

    it('should return false for income', () => {
      expect(isExpense('income')).toBe(false)
    })
  })

  describe('getTransactionStatusLabel', () => {
    it('should return correct label for pending', () => {
      expect(getTransactionStatusLabel('pending')).toBe('Pending')
    })

    it('should return correct label for paid', () => {
      expect(getTransactionStatusLabel('paid')).toBe('Paid')
    })

    it('should return correct label for cancelled', () => {
      expect(getTransactionStatusLabel('cancelled')).toBe('Cancelled')
    })
  })

  describe('getTransactionStatusColor', () => {
    it('should return yellow for pending', () => {
      expect(getTransactionStatusColor('pending')).toBe('yellow')
    })

    it('should return green for paid', () => {
      expect(getTransactionStatusColor('paid')).toBe('green')
    })

    it('should return gray for cancelled', () => {
      expect(getTransactionStatusColor('cancelled')).toBe('gray')
    })
  })
})
