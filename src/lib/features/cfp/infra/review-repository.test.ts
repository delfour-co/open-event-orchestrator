import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createReviewRepository } from './review-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && ')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'review1',
  talkId: 'talk1',
  userId: 'user1',
  rating: 4,
  comment: 'Good talk',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('ReviewRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createReviewRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a review when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('review1')

      expect(mockPb.collection).toHaveBeenCalledWith('reviews')
      expect(result?.id).toBe('review1')
      expect(result?.rating).toBe(4)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByTalk', () => {
    it('should return reviews for a talk', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByTalk('talk1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByUser', () => {
    it('should return reviews by user', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByUser('user1')

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user1')
    })
  })

  describe('findByTalkAndUser', () => {
    it('should return a review when found', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByTalkAndUser('talk1', 'user1')

      expect(result?.id).toBe('review1')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findByTalkAndUser('talk1', 'user99')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a review', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        talkId: 'talk1',
        userId: 'user1',
        rating: 4,
        comment: 'Good talk'
      })

      expect(result.id).toBe('review1')
    })
  })

  describe('update', () => {
    it('should update a review', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, rating: 5 })
      const result = await getRepo().update('review1', { rating: 5 })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('review1', { rating: 5 })
      expect(result.rating).toBe(5)
    })
  })

  describe('upsert', () => {
    it('should update existing review', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, rating: 5 })

      const result = await getRepo().upsert('talk1', 'user1', { rating: 5 })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('review1', { rating: 5 })
      expect(result.rating).toBe(5)
    })

    it('should create new review when none exists', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      const result = await getRepo().upsert('talk1', 'user1', { rating: 4 })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({
        talkId: 'talk1',
        userId: 'user1',
        rating: 4,
        comment: undefined
      })
      expect(result.id).toBe('review1')
    })

    it('should default rating to 3 when not provided', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      await getRepo().upsert('talk1', 'user1', { comment: 'Nice' })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 3 })
      )
    })
  })

  describe('delete', () => {
    it('should delete the review', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('review1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('review1')
    })
  })

  describe('getAverageRating', () => {
    it('should compute average and count', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        {
          ...MOCK_RECORD,
          id: 'r1',
          rating: 4,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        },
        {
          ...MOCK_RECORD,
          id: 'r2',
          rating: 5,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        },
        {
          ...MOCK_RECORD,
          id: 'r3',
          rating: 3,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ])

      const result = await getRepo().getAverageRating('talk1')

      expect(result.count).toBe(3)
      expect(result.average).toBe(4)
    })

    it('should return null average when no reviews', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])

      const result = await getRepo().getAverageRating('talk1')

      expect(result.average).toBeNull()
      expect(result.count).toBe(0)
    })

    it('should round average to one decimal', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        {
          ...MOCK_RECORD,
          id: 'r1',
          rating: 4,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        },
        {
          ...MOCK_RECORD,
          id: 'r2',
          rating: 3,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ])

      const result = await getRepo().getAverageRating('talk1')

      expect(result.average).toBe(3.5)
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('review1')

      expect(result?.talkId).toBe('talk1')
      expect(result?.userId).toBe('user1')
      expect(result?.comment).toBe('Good talk')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })
})
