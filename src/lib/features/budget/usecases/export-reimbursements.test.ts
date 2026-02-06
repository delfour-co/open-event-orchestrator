import { describe, expect, it, vi } from 'vitest'
import type { ReimbursementItem, ReimbursementRequest } from '../domain/reimbursement'
import { createExportReimbursementsUseCase } from './export-reimbursements'

const createMockRequest = (overrides?: Partial<ReimbursementRequest>): ReimbursementRequest => ({
  id: 'req-1',
  editionId: 'edition-1',
  speakerId: 'speaker-1',
  requestNumber: 'RB-DEVFEST-0001',
  status: 'approved',
  totalAmount: 350,
  currency: 'EUR',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockItem = (overrides?: Partial<ReimbursementItem>): ReimbursementItem => ({
  id: 'item-1',
  requestId: 'req-1',
  expenseType: 'transport',
  description: 'Train ticket Paris-Lyon',
  amount: 150,
  date: new Date('2025-10-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('exportReimbursements', () => {
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

  it('should export CSV with header and data rows', async () => {
    const requests = [createMockRequest()]
    const items = [
      createMockItem(),
      createMockItem({
        id: 'item-2',
        expenseType: 'accommodation',
        description: 'Hotel',
        amount: 200
      })
    ]

    mockReimbursementRepo.findByEdition.mockResolvedValue(requests)
    mockItemRepo.findByRequest.mockResolvedValue(items)

    const exportFn = createExportReimbursementsUseCase(mockReimbursementRepo, mockItemRepo)
    const csv = await exportFn('edition-1', { 'speaker-1': 'Jane Speaker' })

    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      'Request Number,Speaker ID,Speaker Name,Status,Expense Type,Description,Amount,Date,Currency'
    )
    expect(lines.length).toBe(3) // header + 2 items
    expect(lines[1]).toContain('RB-DEVFEST-0001')
    expect(lines[1]).toContain('Jane Speaker')
    expect(lines[1]).toContain('Transport')
    expect(lines[1]).toContain('Train ticket Paris-Lyon')
    expect(lines[2]).toContain('Accommodation')
    expect(lines[2]).toContain('Hotel')
  })

  it('should handle request with no items', async () => {
    const requests = [createMockRequest({ totalAmount: 500 })]

    mockReimbursementRepo.findByEdition.mockResolvedValue(requests)
    mockItemRepo.findByRequest.mockResolvedValue([])

    const exportFn = createExportReimbursementsUseCase(mockReimbursementRepo, mockItemRepo)
    const csv = await exportFn('edition-1', { 'speaker-1': 'Jane Speaker' })

    const lines = csv.split('\n')
    expect(lines.length).toBe(2) // header + 1 summary row
    expect(lines[1]).toContain('500')
  })

  it('should handle empty edition', async () => {
    mockReimbursementRepo.findByEdition.mockResolvedValue([])

    const exportFn = createExportReimbursementsUseCase(mockReimbursementRepo, mockItemRepo)
    const csv = await exportFn('edition-1', {})

    const lines = csv.split('\n')
    expect(lines.length).toBe(1) // header only
  })

  it('should escape CSV fields with commas', async () => {
    const requests = [createMockRequest()]
    const items = [createMockItem({ description: 'Train ticket, first class' })]

    mockReimbursementRepo.findByEdition.mockResolvedValue(requests)
    mockItemRepo.findByRequest.mockResolvedValue(items)

    const exportFn = createExportReimbursementsUseCase(mockReimbursementRepo, mockItemRepo)
    const csv = await exportFn('edition-1', { 'speaker-1': 'Jane Speaker' })

    expect(csv).toContain('"Train ticket, first class"')
  })

  it('should use speaker ID when name not found', async () => {
    const requests = [createMockRequest({ speakerId: 'unknown-speaker' })]

    mockReimbursementRepo.findByEdition.mockResolvedValue(requests)
    mockItemRepo.findByRequest.mockResolvedValue([])

    const exportFn = createExportReimbursementsUseCase(mockReimbursementRepo, mockItemRepo)
    const csv = await exportFn('edition-1', {})

    expect(csv).toContain('unknown-speaker')
  })
})
