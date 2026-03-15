import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionFeedbackRepository } from './session-feedback-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeFeedbackRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'fb1',
  sessionId: 'sess1',
  editionId: 'ed1',
  userId: 'user1',
  ratingMode: 'stars',
  numericValue: 4,
  comment: 'Great talk!',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SessionFeedbackRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create session feedback', async () => {
      const record = makeFeedbackRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        sessionId: 'sess1',
        editionId: 'ed1',
        userId: 'user1',
        ratingMode: 'stars',
        numericValue: 4,
        comment: 'Great talk!'
      })

      expect(result.id).toBe('fb1')
      expect(result.numericValue).toBe(4)
      expect(result.ratingMode).toBe('stars')
    })
  })

  describe('update', () => {
    it('should update feedback values', async () => {
      const record = makeFeedbackRecord({ numericValue: 5, comment: 'Amazing!' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'fb1', numericValue: 5, comment: 'Amazing!' })

      expect(result.numericValue).toBe(5)
      expect(result.comment).toBe('Amazing!')
    })
  })

  describe('delete', () => {
    it('should delete session feedback', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      await repo.delete('fb1')

      expect(mockDelete).toHaveBeenCalledWith('fb1')
    })
  })

  describe('getById', () => {
    it('should return feedback when found', async () => {
      const record = makeFeedbackRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('fb1')

      expect(result?.id).toBe('fb1')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('missing')

      expect(result).toBeNull()
    })
  })

  describe('getBySession', () => {
    it('should return all feedback for a session', async () => {
      const records = [makeFeedbackRecord(), makeFeedbackRecord({ id: 'fb2', numericValue: 3 })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getBySession('sess1')

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no feedback', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getBySession('sess1')

      expect(result).toEqual([])
    })
  })

  describe('getByUser', () => {
    it('should return feedback by user', async () => {
      const records = [makeFeedbackRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByUser('user1')

      expect(result).toHaveLength(1)
    })

    it('should filter by edition when provided', async () => {
      const records = [makeFeedbackRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByUser('user1', 'ed1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          expand: 'sessionId'
        })
      )
    })
  })

  describe('getUserFeedbackForSession', () => {
    it('should return feedback when user has submitted for session', async () => {
      const records = [makeFeedbackRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUserFeedbackForSession('user1', 'sess1')

      expect(result?.id).toBe('fb1')
    })

    it('should return null when user has not submitted feedback', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUserFeedbackForSession('user1', 'sess1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const mockGetFullList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUserFeedbackForSession('user1', 'sess1')

      expect(result).toBeNull()
    })
  })

  describe('getUserFeedbackForEdition', () => {
    it('should return all feedback by user for an edition', async () => {
      const records = [makeFeedbackRecord(), makeFeedbackRecord({ id: 'fb2', sessionId: 'sess2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUserFeedbackForEdition('user1', 'ed1')

      expect(result).toHaveLength(2)
    })

    it('should return empty array on error', async () => {
      const mockGetFullList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new SessionFeedbackRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUserFeedbackForEdition('user1', 'ed1')

      expect(result).toEqual([])
    })
  })
})
