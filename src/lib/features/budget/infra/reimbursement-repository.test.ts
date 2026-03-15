import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createReimbursementRepository } from './reimbursement-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeRequestRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'req1',
  editionId: 'edition1',
  speakerId: 'speaker1',
  requestNumber: 'RMB-001',
  status: 'draft',
  totalAmount: 500,
  currency: 'EUR',
  notes: 'Travel expenses',
  adminNotes: null,
  reviewedBy: null,
  reviewedAt: null,
  transactionId: null,
  submittedAt: null,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('ReimbursementRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByEdition', () => {
    it('should return requests for an edition', async () => {
      const records = [makeRequestRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).toHaveLength(1)
      expect(result[0].requestNumber).toBe('RMB-001')
    })
  })

  describe('findBySpeaker', () => {
    it('should return requests for a speaker and edition', async () => {
      const records = [makeRequestRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySpeaker('speaker1', 'edition1')

      expect(result).toHaveLength(1)
      expect(result[0].speakerId).toBe('speaker1')
    })
  })

  describe('findById', () => {
    it('should return request by id', async () => {
      const record = makeRequestRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('req1')

      expect(result?.status).toBe('draft')
      expect(result?.totalAmount).toBe(500)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a reimbursement request', async () => {
      const record = makeRequestRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        speakerId: 'speaker1',
        requestNumber: 'RMB-001'
      })

      expect(result.requestNumber).toBe('RMB-001')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          speakerId: 'speaker1',
          status: 'draft',
          currency: 'EUR'
        })
      )
    })

    it('should use provided optional values', async () => {
      const record = makeRequestRecord({ status: 'submitted', totalAmount: 1000 })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'edition1',
        speakerId: 'speaker1',
        requestNumber: 'RMB-002',
        status: 'submitted',
        totalAmount: 1000
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'submitted',
          totalAmount: 1000
        })
      )
    })
  })

  describe('updateStatus', () => {
    it('should update status with extra fields', async () => {
      const reviewedAt = new Date('2024-03-15')
      const record = makeRequestRecord({
        status: 'approved',
        reviewedBy: 'admin1',
        reviewedAt: reviewedAt.toISOString()
      })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.updateStatus('req1', 'approved', {
        reviewedBy: 'admin1',
        reviewedAt
      })

      expect(result.status).toBe('approved')
      expect(mockUpdate).toHaveBeenCalledWith(
        'req1',
        expect.objectContaining({
          status: 'approved',
          reviewedBy: 'admin1'
        })
      )
    })

    it('should update status without extra fields', async () => {
      const record = makeRequestRecord({ status: 'submitted' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('req1', 'submitted')

      expect(mockUpdate).toHaveBeenCalledWith('req1', { status: 'submitted' })
    })
  })

  describe('delete', () => {
    it('should delete a request by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      await repo.delete('req1')

      expect(mockDelete).toHaveBeenCalledWith('req1')
    })
  })

  describe('getNextSequence', () => {
    it('should return totalItems + 1', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 3 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createReimbursementRepository(mockPb as unknown as PocketBase)
      const result = await repo.getNextSequence('edition1')

      expect(result).toBe(4)
    })
  })
})
