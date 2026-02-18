import type PocketBase from 'pocketbase'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFinancialAuditService } from './financial-audit-service'

describe('FinancialAuditService', () => {
  let mockPb: PocketBase
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreate = vi.fn().mockResolvedValue({ id: 'audit-1' })

    mockPb = {
      collection: vi.fn().mockReturnValue({
        create: mockCreate,
        getFullList: vi.fn().mockResolvedValue([]),
        getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
        getFirstListItem: vi.fn().mockResolvedValue({})
      })
    } as unknown as PocketBase

    // Mock console.error for fireAndForget errors
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logTransactionCreate', () => {
    it('should log transaction creation', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logTransactionCreate('tx-1', { amount: 1000, description: 'Test' })

      // Wait for fireAndForget
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition-1',
          userId: 'user-1',
          action: 'create',
          entityType: 'transaction',
          entityId: 'tx-1'
        })
      )
    })
  })

  describe('logTransactionUpdate', () => {
    it('should log transaction update with old and new values', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logTransactionUpdate('tx-1', { amount: 1000 }, { amount: 1500 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          entityType: 'transaction',
          entityId: 'tx-1',
          oldValue: expect.objectContaining({ amount: 1000 }),
          newValue: expect.objectContaining({ amount: 1500 })
        })
      )
    })
  })

  describe('logTransactionDelete', () => {
    it('should log transaction deletion with old value', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logTransactionDelete('tx-1', { amount: 1000, description: 'Deleted' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete',
          entityType: 'transaction',
          entityId: 'tx-1',
          oldValue: expect.objectContaining({ amount: 1000 })
        })
      )
    })
  })

  describe('logTransactionStatusChange', () => {
    it('should log status change with old and new status', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logTransactionStatusChange('tx-1', 'pending', 'paid', { paidAt: '2024-01-15' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'status_change',
          entityType: 'transaction',
          entityId: 'tx-1',
          oldValue: expect.objectContaining({ status: 'pending' }),
          newValue: expect.objectContaining({ status: 'paid', paidAt: '2024-01-15' })
        })
      )
    })
  })

  describe('logQuoteCreate', () => {
    it('should log quote creation with reference', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logQuoteCreate('quote-1', 'Q-2024-001', { amount: 5000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'quote',
          entityId: 'quote-1',
          entityReference: 'Q-2024-001',
          newValue: expect.objectContaining({ amount: 5000 })
        })
      )
    })
  })

  describe('logQuoteConvert', () => {
    it('should log quote conversion with transaction metadata', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logQuoteConvert('quote-1', 'Q-2024-001', 'tx-1', { amount: 5000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'convert',
          entityType: 'quote',
          entityId: 'quote-1',
          entityReference: 'Q-2024-001',
          metadata: expect.objectContaining({ transactionId: 'tx-1' })
        })
      )
    })
  })

  describe('logInvoiceCreate', () => {
    it('should log invoice creation', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logInvoiceCreate('invoice-1', 'INV-2024-001', { totalAmount: 10000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'invoice',
          entityId: 'invoice-1',
          entityReference: 'INV-2024-001'
        })
      )
    })
  })

  describe('logReimbursementApprove', () => {
    it('should log reimbursement approval with transaction link', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logReimbursementApprove('reimb-1', 'R-2024-001', 'tx-1', { amount: 500 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'approve',
          entityType: 'reimbursement',
          entityId: 'reimb-1',
          entityReference: 'R-2024-001',
          metadata: expect.objectContaining({ transactionId: 'tx-1' })
        })
      )
    })
  })

  describe('logCategoryCreate', () => {
    it('should log category creation', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logCategoryCreate('cat-1', 'Venue', { plannedAmount: 5000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'category',
          entityId: 'cat-1',
          entityReference: 'Venue'
        })
      )
    })
  })

  describe('logBudgetCreate', () => {
    it('should log budget creation', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logBudgetCreate('budget-1', { plannedBudget: 50000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'budget',
          entityId: 'budget-1'
        })
      )
    })
  })

  describe('logBudgetStatusChange', () => {
    it('should log budget status change', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      service.logBudgetStatusChange('budget-1', 'draft', 'approved')

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'status_change',
          entityType: 'budget',
          entityId: 'budget-1',
          oldValue: expect.objectContaining({ status: 'draft' }),
          newValue: expect.objectContaining({ status: 'approved' })
        })
      )
    })
  })

  describe('context handling', () => {
    it('should work without userId', async () => {
      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1'
      })

      service.logTransactionCreate('tx-1', { amount: 1000 })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCreate).toHaveBeenCalled()
      const callArg = mockCreate.mock.calls[0][0]
      expect(callArg.editionId).toBe('edition-1')
      // userId should be null or undefined when not provided
      expect(callArg.userId == null).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should not throw when audit log fails', async () => {
      mockCreate.mockRejectedValue(new Error('Database error'))

      const service = createFinancialAuditService(mockPb, {
        editionId: 'edition-1',
        userId: 'user-1'
      })

      // Should not throw
      expect(() => {
        service.logTransactionCreate('tx-1', { amount: 1000 })
      }).not.toThrow()

      await new Promise((resolve) => setTimeout(resolve, 10))

      // Error should be logged to console
      expect(console.error).toHaveBeenCalled()
    })
  })
})
