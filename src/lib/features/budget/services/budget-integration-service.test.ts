import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordCreditNote, recordIncome } from './budget-integration-service'

const mockBudget = { id: 'budget-1', editionId: 'edition-1' }
const mockNewBudget = { id: 'budget-new', editionId: 'edition-no-budget' }
const mockSponsoringCategory = { id: 'cat-1', budgetId: 'budget-1', name: 'Sponsoring' }
const mockTicketingCategory = { id: 'cat-2', budgetId: 'budget-1', name: 'Ticketing' }
const mockTransaction = { id: 'tx-1', categoryId: 'cat-1' }
const mockInvoice = { id: 'inv-1', transactionId: 'tx-1', invoiceNumber: 'F-2026-000001' }

const mockFindByEdition = vi.fn()
const mockBudgetCreate = vi.fn()
const mockFindByBudget = vi.fn()
const mockCategoryCreate = vi.fn()
const mockTransactionCreate = vi.fn()
const mockInvoiceCreate = vi.fn()
const mockLogTransactionCreate = vi.fn()
const mockLogInvoiceCreate = vi.fn()

vi.mock('$lib/features/budget/infra', () => ({
  createBudgetRepository: () => ({
    findByEdition: mockFindByEdition,
    create: mockBudgetCreate
  }),
  createCategoryRepository: () => ({
    findByBudget: mockFindByBudget,
    create: mockCategoryCreate
  }),
  createTransactionRepository: () => ({ create: mockTransactionCreate }),
  createInvoiceRepository: () => ({ create: mockInvoiceCreate })
}))

vi.mock('./financial-audit-service', () => ({
  createFinancialAuditService: () => ({
    logTransactionCreate: mockLogTransactionCreate,
    logInvoiceCreate: mockLogInvoiceCreate
  })
}))

describe('budget-integration-service', () => {
  const pdfBytes = new Uint8Array([37, 80, 68, 70]) // %PDF

  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByEdition.mockResolvedValue(mockBudget)
    mockFindByBudget.mockResolvedValue([mockSponsoringCategory, mockTicketingCategory])
    mockTransactionCreate.mockResolvedValue(mockTransaction)
    mockInvoiceCreate.mockResolvedValue(mockInvoice)
    mockBudgetCreate.mockResolvedValue(mockNewBudget)
    mockCategoryCreate.mockResolvedValue({
      id: 'cat-new',
      budgetId: 'budget-new',
      name: 'Ticketing'
    })
  })

  describe('recordIncome', () => {
    it('should create a transaction and invoice with PDF', async () => {
      await recordIncome({
        pb: {} as never,
        editionId: 'edition-1',
        description: 'Sponsor: Acme Corp - Gold Package',
        amount: 5000,
        invoiceNumber: 'F-2026-000001',
        pdfBytes,
        vendor: 'Acme Corp',
        source: 'sponsoring'
      })

      expect(mockTransactionCreate).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        type: 'income',
        amount: 5000,
        description: 'Sponsor: Acme Corp - Gold Package',
        vendor: 'Acme Corp',
        invoiceNumber: 'F-2026-000001',
        date: expect.any(Date),
        status: 'paid'
      })

      expect(mockInvoiceCreate).toHaveBeenCalledWith(expect.any(FormData))
      expect(mockLogTransactionCreate).toHaveBeenCalled()
      expect(mockLogInvoiceCreate).toHaveBeenCalled()
    })

    it('should auto-create budget when none exists', async () => {
      mockFindByEdition.mockResolvedValue(null)
      mockFindByBudget.mockResolvedValue([])

      await recordIncome({
        pb: {} as never,
        editionId: 'edition-no-budget',
        description: 'Test',
        amount: 100,
        invoiceNumber: 'F-2026-000002',
        pdfBytes,
        source: 'billing'
      })

      expect(mockBudgetCreate).toHaveBeenCalledWith({
        editionId: 'edition-no-budget',
        totalBudget: 0,
        currency: 'EUR',
        status: 'draft'
      })
      expect(mockTransactionCreate).toHaveBeenCalled()
      expect(mockInvoiceCreate).toHaveBeenCalled()
    })

    it('should auto-create category when not found', async () => {
      mockFindByBudget.mockResolvedValue([]) // no existing categories

      await recordIncome({
        pb: {} as never,
        editionId: 'edition-1',
        description: 'Ticket order #123',
        amount: 50,
        invoiceNumber: 'F-2026-000003',
        pdfBytes,
        source: 'billing'
      })

      expect(mockCategoryCreate).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        name: 'Ticketing',
        plannedAmount: 0
      })
      expect(mockTransactionCreate).toHaveBeenCalled()
    })
  })

  describe('recordCreditNote', () => {
    it('should create an expense transaction and invoice with PDF', async () => {
      await recordCreditNote({
        pb: {} as never,
        editionId: 'edition-1',
        description: 'Refund order #123',
        amount: 50,
        creditNoteNumber: 'A-2026-000001',
        pdfBytes,
        vendor: 'John Doe',
        source: 'billing'
      })

      expect(mockTransactionCreate).toHaveBeenCalledWith({
        categoryId: 'cat-2',
        type: 'expense',
        amount: 50,
        description: 'Refund order #123',
        vendor: 'John Doe',
        invoiceNumber: 'A-2026-000001',
        date: expect.any(Date),
        status: 'paid'
      })

      expect(mockInvoiceCreate).toHaveBeenCalledWith(expect.any(FormData))
      expect(mockLogTransactionCreate).toHaveBeenCalled()
      expect(mockLogInvoiceCreate).toHaveBeenCalled()
    })

    it('should auto-create budget when none exists', async () => {
      mockFindByEdition.mockResolvedValue(null)
      mockFindByBudget.mockResolvedValue([])

      await recordCreditNote({
        pb: {} as never,
        editionId: 'edition-no-budget',
        description: 'Refund',
        amount: 100,
        creditNoteNumber: 'A-2026-000002',
        pdfBytes,
        source: 'billing'
      })

      expect(mockBudgetCreate).toHaveBeenCalledWith({
        editionId: 'edition-no-budget',
        totalBudget: 0,
        currency: 'EUR',
        status: 'draft'
      })
      expect(mockTransactionCreate).toHaveBeenCalled()
      expect(mockInvoiceCreate).toHaveBeenCalled()
    })
  })
})
