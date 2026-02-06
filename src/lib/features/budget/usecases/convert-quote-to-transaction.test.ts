import { describe, expect, it, vi } from 'vitest'
import type { BudgetQuote } from '../domain/quote'
import type { BudgetTransaction } from '../domain/transaction'
import { createConvertQuoteToTransactionUseCase } from './convert-quote-to-transaction'

const createMockQuote = (overrides?: Partial<BudgetQuote>): BudgetQuote => ({
  id: 'quote-1',
  editionId: 'edition-1',
  quoteNumber: 'QT-DEVFEST-0001',
  vendor: 'Catering Co',
  vendorEmail: 'catering@example.com',
  description: 'Conference catering',
  items: [{ description: 'Lunch day 1', quantity: 200, unitPrice: 15 }],
  totalAmount: 3000,
  currency: 'EUR',
  status: 'accepted',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockTransaction = (overrides?: Partial<BudgetTransaction>): BudgetTransaction => ({
  id: 'tx-1',
  categoryId: 'cat-1',
  type: 'expense',
  amount: 3000,
  description: 'Catering Co - Conference catering',
  vendor: 'Catering Co',
  invoiceNumber: 'QT-DEVFEST-0001',
  date: new Date(),
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('convertQuoteToTransaction', () => {
  const mockQuoteRepo = {
    findByEdition: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getNextSequence: vi.fn()
  }

  const mockTransactionRepo = {
    findByCategory: vi.fn(),
    findByBudget: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countByCategory: vi.fn(),
    sumByCategory: vi.fn()
  }

  it('should convert accepted quote to expense transaction', async () => {
    const quote = createMockQuote()
    const transaction = createMockTransaction()

    mockQuoteRepo.findById.mockResolvedValue(quote)
    mockTransactionRepo.create.mockResolvedValue(transaction)
    mockQuoteRepo.updateStatus.mockResolvedValue({ ...quote, transactionId: 'tx-1' })

    const convert = createConvertQuoteToTransactionUseCase(mockQuoteRepo, mockTransactionRepo)
    const result = await convert({ quoteId: 'quote-1', categoryId: 'cat-1' })

    expect(result.transaction.type).toBe('expense')
    expect(result.transaction.amount).toBe(3000)
    expect(mockTransactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-1',
        type: 'expense',
        amount: 3000,
        vendor: 'Catering Co'
      })
    )
    expect(mockQuoteRepo.updateStatus).toHaveBeenCalledWith(
      'quote-1',
      'accepted',
      expect.objectContaining({ transactionId: 'tx-1' })
    )
  })

  it('should throw when quote not found', async () => {
    mockQuoteRepo.findById.mockResolvedValue(null)

    const convert = createConvertQuoteToTransactionUseCase(mockQuoteRepo, mockTransactionRepo)
    await expect(convert({ quoteId: 'nonexistent', categoryId: 'cat-1' })).rejects.toThrow(
      'Quote not found'
    )
  })

  it('should throw when quote is not accepted', async () => {
    const draftQuote = createMockQuote({ status: 'draft' })
    mockQuoteRepo.findById.mockResolvedValue(draftQuote)

    const convert = createConvertQuoteToTransactionUseCase(mockQuoteRepo, mockTransactionRepo)
    await expect(convert({ quoteId: 'quote-1', categoryId: 'cat-1' })).rejects.toThrow(
      'Cannot convert quote with status "draft"'
    )
  })

  it('should throw when quote is rejected', async () => {
    const rejectedQuote = createMockQuote({ status: 'rejected' })
    mockQuoteRepo.findById.mockResolvedValue(rejectedQuote)

    const convert = createConvertQuoteToTransactionUseCase(mockQuoteRepo, mockTransactionRepo)
    await expect(convert({ quoteId: 'quote-1', categoryId: 'cat-1' })).rejects.toThrow(
      'Cannot convert quote with status "rejected"'
    )
  })
})
