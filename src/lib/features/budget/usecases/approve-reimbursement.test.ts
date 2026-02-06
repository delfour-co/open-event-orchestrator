import { describe, expect, it, vi } from 'vitest'
import type { ReimbursementItem, ReimbursementRequest } from '../domain/reimbursement'
import type { BudgetTransaction } from '../domain/transaction'
import { createApproveReimbursementUseCase } from './approve-reimbursement'

const createMockRequest = (overrides?: Partial<ReimbursementRequest>): ReimbursementRequest => ({
  id: 'req-1',
  editionId: 'edition-1',
  speakerId: 'speaker-1',
  requestNumber: 'RB-DEVFEST-0001',
  status: 'submitted',
  totalAmount: 0,
  currency: 'EUR',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockItem = (overrides?: Partial<ReimbursementItem>): ReimbursementItem => ({
  id: 'item-1',
  requestId: 'req-1',
  expenseType: 'transport',
  description: 'Train ticket',
  amount: 150,
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('approveReimbursement', () => {
  const mockReimbursementRepo = {
    findByEdition: vi.fn(),
    findBySpeaker: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getNextSequence: vi.fn()
  }

  const mockItemRepo = {
    findByRequest: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getReceiptUrl: vi.fn()
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

  it('should approve submitted request and create expense transaction', async () => {
    const request = createMockRequest({ status: 'submitted' })
    const items = [
      createMockItem({ amount: 150 }),
      createMockItem({ id: 'item-2', amount: 200, expenseType: 'accommodation' })
    ]
    const transaction: BudgetTransaction = {
      id: 'tx-1',
      categoryId: 'cat-speakers',
      type: 'expense',
      amount: 350,
      description: 'Speaker reimbursement - RB-DEVFEST-0001',
      vendor: 'Speaker speaker-1',
      date: new Date(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockReimbursementRepo.findById.mockResolvedValue(request)
    mockItemRepo.findByRequest.mockResolvedValue(items)
    mockTransactionRepo.create.mockResolvedValue(transaction)
    mockReimbursementRepo.updateStatus.mockResolvedValue({
      ...request,
      status: 'approved',
      transactionId: 'tx-1',
      totalAmount: 350
    })

    const approve = createApproveReimbursementUseCase(
      mockReimbursementRepo,
      mockItemRepo,
      mockTransactionRepo
    )

    const result = await approve({
      requestId: 'req-1',
      categoryId: 'cat-speakers',
      reviewedBy: 'admin-1',
      adminNotes: 'Approved'
    })

    expect(result.transaction.amount).toBe(350)
    expect(result.transaction.type).toBe('expense')
    expect(mockTransactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 350, categoryId: 'cat-speakers' })
    )
    expect(mockReimbursementRepo.updateStatus).toHaveBeenCalledWith(
      'req-1',
      'approved',
      expect.objectContaining({
        reviewedBy: 'admin-1',
        transactionId: 'tx-1',
        totalAmount: 350
      })
    )
  })

  it('should approve under_review request', async () => {
    const request = createMockRequest({ status: 'under_review' })
    mockReimbursementRepo.findById.mockResolvedValue(request)
    mockItemRepo.findByRequest.mockResolvedValue([createMockItem()])
    mockTransactionRepo.create.mockResolvedValue({
      id: 'tx-1',
      categoryId: 'cat-1',
      type: 'expense',
      amount: 150,
      description: 'test',
      date: new Date(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    mockReimbursementRepo.updateStatus.mockResolvedValue({
      ...request,
      status: 'approved'
    })

    const approve = createApproveReimbursementUseCase(
      mockReimbursementRepo,
      mockItemRepo,
      mockTransactionRepo
    )

    const result = await approve({
      requestId: 'req-1',
      categoryId: 'cat-1',
      reviewedBy: 'admin-1'
    })

    expect(result.request.status).toBe('approved')
  })

  it('should throw when request not found', async () => {
    mockReimbursementRepo.findById.mockResolvedValue(null)

    const approve = createApproveReimbursementUseCase(
      mockReimbursementRepo,
      mockItemRepo,
      mockTransactionRepo
    )

    await expect(
      approve({ requestId: 'nonexistent', categoryId: 'cat-1', reviewedBy: 'admin-1' })
    ).rejects.toThrow('Reimbursement request not found')
  })

  it('should throw when request is in draft status', async () => {
    const request = createMockRequest({ status: 'draft' })
    mockReimbursementRepo.findById.mockResolvedValue(request)

    const approve = createApproveReimbursementUseCase(
      mockReimbursementRepo,
      mockItemRepo,
      mockTransactionRepo
    )

    await expect(
      approve({ requestId: 'req-1', categoryId: 'cat-1', reviewedBy: 'admin-1' })
    ).rejects.toThrow('Cannot approve reimbursement with status "draft"')
  })

  it('should throw when request is already approved', async () => {
    const request = createMockRequest({ status: 'approved' })
    mockReimbursementRepo.findById.mockResolvedValue(request)

    const approve = createApproveReimbursementUseCase(
      mockReimbursementRepo,
      mockItemRepo,
      mockTransactionRepo
    )

    await expect(
      approve({ requestId: 'req-1', categoryId: 'cat-1', reviewedBy: 'admin-1' })
    ).rejects.toThrow('Cannot approve reimbursement with status "approved"')
  })
})
