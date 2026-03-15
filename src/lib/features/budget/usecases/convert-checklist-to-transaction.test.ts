import { describe, expect, it, vi } from 'vitest'
import type { ChecklistItemRepository } from '../infra/checklist-item-repository'
import type { TransactionRepository } from '../infra/transaction-repository'
import { createConvertChecklistToTransactionUseCase } from './convert-checklist-to-transaction'

vi.mock('../domain', () => ({
  canConvertToTransaction: (status: string, transactionId?: string) =>
    status === 'approved' && !transactionId
}))

const makeChecklistItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'chk1',
  editionId: 'edition1',
  categoryId: 'cat1',
  name: 'Book venue',
  estimatedAmount: 5000,
  status: 'approved' as const,
  priority: 'high' as const,
  assignee: 'vendor1',
  order: 0,
  transactionId: undefined,
  createdBy: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const makeTransaction = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx1',
  categoryId: 'cat1',
  type: 'expense' as const,
  amount: 5000,
  description: 'Book venue',
  vendor: 'vendor1',
  date: new Date(),
  status: 'pending' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('ConvertChecklistToTransactionUseCase', () => {
  const createMockRepos = () => {
    const checklistRepo = {
      findById: vi.fn(),
      update: vi.fn()
    } as unknown as ChecklistItemRepository
    const transactionRepo = {
      create: vi.fn()
    } as unknown as TransactionRepository
    return { checklistRepo, transactionRepo }
  }

  it('should create transaction from checklist item and update item', async () => {
    const { checklistRepo, transactionRepo } = createMockRepos()
    const item = makeChecklistItem()
    const transaction = makeTransaction()

    vi.mocked(checklistRepo.findById).mockResolvedValue(item)
    vi.mocked(transactionRepo.create).mockResolvedValue(transaction)
    vi.mocked(checklistRepo.update).mockResolvedValue(
      makeChecklistItem({
        status: 'paid',
        transactionId: 'tx1'
      })
    )

    const useCase = createConvertChecklistToTransactionUseCase(checklistRepo, transactionRepo)
    const result = await useCase({
      checklistItemId: 'chk1',
      categoryId: 'cat1'
    })

    expect(result.transaction.id).toBe('tx1')
    expect(result.updatedChecklistItemId).toBe('chk1')
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat1',
        type: 'expense',
        amount: 5000,
        description: 'Book venue',
        vendor: 'vendor1',
        status: 'pending'
      })
    )
    expect(checklistRepo.update).toHaveBeenCalledWith('chk1', {
      status: 'paid',
      transactionId: 'tx1'
    })
  })

  it('should use provided date', async () => {
    const { checklistRepo, transactionRepo } = createMockRepos()
    const customDate = new Date('2024-06-15')

    vi.mocked(checklistRepo.findById).mockResolvedValue(makeChecklistItem())
    vi.mocked(transactionRepo.create).mockResolvedValue(makeTransaction())
    vi.mocked(checklistRepo.update).mockResolvedValue(
      makeChecklistItem({ status: 'paid', transactionId: 'tx1' })
    )

    const useCase = createConvertChecklistToTransactionUseCase(checklistRepo, transactionRepo)
    await useCase({
      checklistItemId: 'chk1',
      categoryId: 'cat1',
      date: customDate
    })

    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        date: customDate
      })
    )
  })

  it('should throw when checklist item not found', async () => {
    const { checklistRepo, transactionRepo } = createMockRepos()
    vi.mocked(checklistRepo.findById).mockResolvedValue(null)

    const useCase = createConvertChecklistToTransactionUseCase(checklistRepo, transactionRepo)

    await expect(
      useCase({
        checklistItemId: 'nonexistent',
        categoryId: 'cat1'
      })
    ).rejects.toThrow('Checklist item not found')
  })

  it('should throw when item cannot be converted (wrong status)', async () => {
    const { checklistRepo, transactionRepo } = createMockRepos()
    vi.mocked(checklistRepo.findById).mockResolvedValue(makeChecklistItem({ status: 'pending' }))

    const useCase = createConvertChecklistToTransactionUseCase(checklistRepo, transactionRepo)

    await expect(
      useCase({
        checklistItemId: 'chk1',
        categoryId: 'cat1'
      })
    ).rejects.toThrow('Cannot convert checklist item to transaction')
  })

  it('should throw when item already has a transaction', async () => {
    const { checklistRepo, transactionRepo } = createMockRepos()
    vi.mocked(checklistRepo.findById).mockResolvedValue(
      makeChecklistItem({ status: 'approved', transactionId: 'existing_tx' })
    )

    const useCase = createConvertChecklistToTransactionUseCase(checklistRepo, transactionRepo)

    await expect(
      useCase({
        checklistItemId: 'chk1',
        categoryId: 'cat1'
      })
    ).rejects.toThrow('Cannot convert checklist item to transaction')
  })
})
