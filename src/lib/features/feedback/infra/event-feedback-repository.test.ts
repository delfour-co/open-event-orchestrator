import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventFeedbackRepository } from './event-feedback-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeFeedbackRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'ef1',
  editionId: 'ed1',
  userId: 'user1',
  feedbackType: 'general',
  numericValue: 8,
  message: 'Great event overall!',
  status: 'open',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('EventFeedbackRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create event feedback', async () => {
      const record = makeFeedbackRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        userId: 'user1',
        feedbackType: 'general',
        numericValue: 8,
        message: 'Great event overall!',
        status: 'open'
      })

      expect(result.id).toBe('ef1')
      expect(result.feedbackType).toBe('general')
      expect(result.numericValue).toBe(8)
    })

    it('should default status to open', async () => {
      const record = makeFeedbackRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        userId: 'user1',
        feedbackType: 'general',
        message: 'Nice!'
      })

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
    })
  })

  describe('update', () => {
    it('should update feedback fields', async () => {
      const record = makeFeedbackRecord({ numericValue: 9, message: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({
        id: 'ef1',
        numericValue: 9,
        message: 'Updated',
        status: 'open'
      })

      expect(result.numericValue).toBe(9)
    })
  })

  describe('delete', () => {
    it('should delete event feedback', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      await repo.delete('ef1')

      expect(mockDelete).toHaveBeenCalledWith('ef1')
    })
  })

  describe('getById', () => {
    it('should return feedback when found', async () => {
      const record = makeFeedbackRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('ef1')

      expect(result?.id).toBe('ef1')
      expect(result?.message).toBe('Great event overall!')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('missing')

      expect(result).toBeNull()
    })
  })

  describe('getByEdition', () => {
    it('should return feedback for an edition sorted by created desc', async () => {
      const records = [
        makeFeedbackRecord(),
        makeFeedbackRecord({ id: 'ef2', message: 'Another feedback' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: '-created' }))
    })
  })

  describe('getByUser', () => {
    it('should return feedback by user', async () => {
      const records = [makeFeedbackRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByUser('user1')

      expect(result).toHaveLength(1)
    })

    it('should filter by edition when provided', async () => {
      const records = [makeFeedbackRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByUser('user1', 'ed1')

      expect(result).toHaveLength(1)
    })

    it('should return empty array when no feedback', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new EventFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByUser('user1')

      expect(result).toEqual([])
    })
  })
})
