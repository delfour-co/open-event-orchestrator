import { describe, expect, it } from 'vitest'
import { budgetInvoiceSchema, createInvoiceSchema, isOverdue } from './invoice'
import type { BudgetInvoice } from './invoice'

describe('BudgetInvoice', () => {
  const now = new Date()

  const validInvoice = {
    id: 'inv-123',
    transactionId: 'tx-456',
    invoiceNumber: 'INV-2025-001',
    file: 'invoices/inv-2025-001.pdf',
    issueDate: now,
    dueDate: new Date('2025-12-31'),
    amount: 5000,
    notes: 'Venue rental invoice',
    createdAt: now,
    updatedAt: now
  }

  describe('budgetInvoiceSchema', () => {
    it('should validate a complete invoice', () => {
      const result = budgetInvoiceSchema.safeParse(validInvoice)
      expect(result.success).toBe(true)
    })

    it('should validate minimal invoice without optional fields', () => {
      const minimal = {
        id: 'inv-123',
        transactionId: 'tx-456',
        invoiceNumber: 'INV-001',
        issueDate: now,
        amount: 100,
        createdAt: now,
        updatedAt: now
      }
      const result = budgetInvoiceSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty invoiceNumber', () => {
      const result = budgetInvoiceSchema.safeParse({
        ...validInvoice,
        invoiceNumber: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject invoiceNumber exceeding max length', () => {
      const result = budgetInvoiceSchema.safeParse({
        ...validInvoice,
        invoiceNumber: 'a'.repeat(101)
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const result = budgetInvoiceSchema.safeParse({
        ...validInvoice,
        amount: -100
      })
      expect(result.success).toBe(false)
    })

    it('should accept zero amount', () => {
      const result = budgetInvoiceSchema.safeParse({
        ...validInvoice,
        amount: 0
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createInvoiceSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        transactionId: 'tx-456',
        invoiceNumber: 'INV-2025-002',
        issueDate: now,
        amount: 3000
      }
      const result = createInvoiceSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate creation data with all optional fields', () => {
      const createData = {
        transactionId: 'tx-456',
        invoiceNumber: 'INV-2025-002',
        file: 'invoices/inv-002.pdf',
        issueDate: now,
        dueDate: new Date('2025-12-31'),
        amount: 3000,
        notes: 'Some notes'
      }
      const result = createInvoiceSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('isOverdue', () => {
    it('should return true when due date is in the past', () => {
      const invoice: BudgetInvoice = {
        ...validInvoice,
        dueDate: new Date('2020-01-01')
      }
      expect(isOverdue(invoice)).toBe(true)
    })

    it('should return false when due date is in the future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const invoice: BudgetInvoice = {
        ...validInvoice,
        dueDate: futureDate
      }
      expect(isOverdue(invoice)).toBe(false)
    })

    it('should return false when no due date is set', () => {
      const invoice: BudgetInvoice = {
        ...validInvoice,
        dueDate: undefined
      }
      expect(isOverdue(invoice)).toBe(false)
    })
  })
})
