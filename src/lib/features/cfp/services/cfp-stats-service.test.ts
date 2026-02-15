import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCfpStatsService } from './cfp-stats-service'

const createMockPb = () => ({
  collection: vi.fn()
})

describe('cfp-stats-service', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('getSubmissionStats', () => {
    it('should return correct counts by status', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi
          .fn()
          .mockResolvedValue([
            { status: 'draft' },
            { status: 'draft' },
            { status: 'submitted' },
            { status: 'under_review' },
            { status: 'accepted' },
            { status: 'rejected' }
          ])
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getSubmissionStats('edition-1')

      expect(stats.total).toBe(6)
      expect(stats.byStatus.draft).toBe(2)
      expect(stats.byStatus.submitted).toBe(1)
      expect(stats.byStatus.under_review).toBe(1)
      expect(stats.byStatus.accepted).toBe(1)
      expect(stats.byStatus.rejected).toBe(1)
      expect(stats.submittedCount).toBe(4)
      expect(stats.draftCount).toBe(2)
    })

    it('should handle empty talks list', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getSubmissionStats('edition-1')

      expect(stats.total).toBe(0)
      expect(stats.submittedCount).toBe(0)
      expect(stats.draftCount).toBe(0)
    })
  })

  describe('getReviewStats', () => {
    it('should calculate review statistics correctly', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([{ id: 'talk-1' }, { id: 'talk-2' }, { id: 'talk-3' }])
        .mockResolvedValueOnce([
          { talkId: 'talk-1', rating: 4 },
          { talkId: 'talk-1', rating: 5 },
          { talkId: 'talk-2', rating: 3 }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getReviewStats('edition-1')

      expect(stats.totalReviews).toBe(3)
      expect(stats.reviewedTalks).toBe(2)
      expect(stats.pendingReviewTalks).toBe(1)
      expect(stats.averageReviewsPerTalk).toBe(1)
      expect(stats.averageRating).toBe(4)
    })

    it('should handle no talks', async () => {
      mockPb.collection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getReviewStats('edition-1')

      expect(stats.totalReviews).toBe(0)
      expect(stats.reviewedTalks).toBe(0)
      expect(stats.pendingReviewTalks).toBe(0)
      expect(stats.averageReviewsPerTalk).toBe(0)
      expect(stats.averageRating).toBeNull()
    })

    it('should handle talks with no reviews', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([{ id: 'talk-1' }, { id: 'talk-2' }])
        .mockResolvedValueOnce([])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getReviewStats('edition-1')

      expect(stats.totalReviews).toBe(0)
      expect(stats.reviewedTalks).toBe(0)
      expect(stats.pendingReviewTalks).toBe(2)
      expect(stats.averageRating).toBeNull()
    })
  })

  describe('getAcceptanceRate', () => {
    it('should calculate global acceptance rate', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { status: 'accepted', categoryId: 'cat-1' },
          { status: 'accepted', categoryId: 'cat-1' },
          { status: 'rejected', categoryId: 'cat-2' },
          { status: 'rejected', categoryId: 'cat-2' },
          { status: 'submitted', categoryId: 'cat-1' }
        ])
        .mockResolvedValueOnce([
          { id: 'cat-1', name: 'Web' },
          { id: 'cat-2', name: 'Mobile' }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getAcceptanceRate('edition-1')

      expect(stats.globalRate).toBe(50)
      expect(stats.acceptedCount).toBe(2)
      expect(stats.decidedCount).toBe(4)
    })

    it('should calculate per-category acceptance rates', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { status: 'accepted', categoryId: 'cat-1' },
          { status: 'accepted', categoryId: 'cat-1' },
          { status: 'rejected', categoryId: 'cat-1' },
          { status: 'rejected', categoryId: 'cat-2' },
          { status: 'rejected', categoryId: 'cat-2' }
        ])
        .mockResolvedValueOnce([
          { id: 'cat-1', name: 'Web' },
          { id: 'cat-2', name: 'Mobile' }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getAcceptanceRate('edition-1')

      expect(stats.byCategory).toHaveLength(2)

      const webCategory = stats.byCategory.find((c) => c.categoryName === 'Web')
      expect(webCategory?.rate).toBe(67)
      expect(webCategory?.accepted).toBe(2)
      expect(webCategory?.submitted).toBe(3)

      const mobileCategory = stats.byCategory.find((c) => c.categoryName === 'Mobile')
      expect(mobileCategory?.rate).toBe(0)
    })

    it('should handle no decided talks', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { status: 'draft', categoryId: 'cat-1' },
          { status: 'submitted', categoryId: 'cat-1' }
        ])
        .mockResolvedValueOnce([{ id: 'cat-1', name: 'Web' }])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getAcceptanceRate('edition-1')

      expect(stats.globalRate).toBe(0)
      expect(stats.acceptedCount).toBe(0)
      expect(stats.decidedCount).toBe(0)
      expect(stats.byCategory).toHaveLength(0)
    })

    it('should sort categories by rate descending', async () => {
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce([
          { status: 'rejected', categoryId: 'cat-1' },
          { status: 'accepted', categoryId: 'cat-2' },
          { status: 'accepted', categoryId: 'cat-3' },
          { status: 'rejected', categoryId: 'cat-3' }
        ])
        .mockResolvedValueOnce([
          { id: 'cat-1', name: 'First' },
          { id: 'cat-2', name: 'Second' },
          { id: 'cat-3', name: 'Third' }
        ])

      mockPb.collection.mockReturnValue({
        getFullList: mockGetFullList
      })

      const service = createCfpStatsService(mockPb as never)
      const stats = await service.getAcceptanceRate('edition-1')

      expect(stats.byCategory[0].rate).toBe(100)
      expect(stats.byCategory[1].rate).toBe(50)
      expect(stats.byCategory[2].rate).toBe(0)
    })
  })
})
