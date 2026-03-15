import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvaluationPlanRepository } from './evaluation-plan-repository'

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'plan1',
  editionId: 'edition1',
  name: 'Technical Review',
  description: 'Review technical talks',
  categoryIds: ['cat1', 'cat2'],
  reviewerIds: ['user1', 'user2'],
  isActive: true,
  createdBy: 'admin1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('EvaluationPlanRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createEvaluationPlanRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a plan when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('plan1')

      expect(mockPb.collection).toHaveBeenCalledWith('evaluation_plans')
      expect(result?.id).toBe('plan1')
      expect(result?.name).toBe('Technical Review')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return plans sorted by name', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'name'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByReviewer', () => {
    it('should filter by edition, reviewer and active status', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByReviewer('edition1', 'user1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('isActive=true'),
        sort: 'name'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByCategory', () => {
    it('should filter by edition, category and active status', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByCategory('edition1', 'cat1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('categoryIds'),
        sort: 'name'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a plan with defaults', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        name: 'New Plan',
        createdBy: 'admin1'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          name: 'New Plan',
          description: null,
          categoryIds: [],
          reviewerIds: [],
          isActive: true,
          createdBy: 'admin1'
        })
      )
    })

    it('should accept provided arrays', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        name: 'Plan',
        categoryIds: ['cat1'],
        reviewerIds: ['user1'],
        createdBy: 'admin1'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryIds: ['cat1'],
          reviewerIds: ['user1']
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, name: 'Updated' })
      await getRepo().update({ id: 'plan1', name: 'Updated' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('plan1', { name: 'Updated' })
    })

    it('should not include undefined fields', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().update({ id: 'plan1', isActive: false })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs).toEqual({ isActive: false })
    })
  })

  describe('delete', () => {
    it('should delete the plan', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('plan1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('plan1')
    })
  })

  describe('addReviewer', () => {
    it('should add a reviewer to the plan', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({
        ...MOCK_RECORD,
        reviewerIds: ['user1', 'user2', 'user3']
      })

      const result = await getRepo().addReviewer('plan1', 'user3')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('plan1', {
        reviewerIds: ['user1', 'user2', 'user3']
      })
      expect(result.reviewerIds).toContain('user3')
    })

    it('should return plan unchanged if reviewer already exists', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)

      const result = await getRepo().addReviewer('plan1', 'user1')

      expect(mockPb.mockCollection.update).not.toHaveBeenCalled()
      expect(result.reviewerIds).toContain('user1')
    })

    it('should throw when plan not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      await expect(getRepo().addReviewer('nonexistent', 'user1')).rejects.toThrow(
        'Evaluation plan not found'
      )
    })
  })

  describe('removeReviewer', () => {
    it('should remove a reviewer from the plan', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({
        ...MOCK_RECORD,
        reviewerIds: ['user1']
      })

      await getRepo().removeReviewer('plan1', 'user2')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('plan1', {
        reviewerIds: ['user1']
      })
    })

    it('should throw when plan not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      await expect(getRepo().removeReviewer('nonexistent', 'user1')).rejects.toThrow(
        'Evaluation plan not found'
      )
    })
  })

  describe('addCategory', () => {
    it('should add a category to the plan', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({
        ...MOCK_RECORD,
        categoryIds: ['cat1', 'cat2', 'cat3']
      })

      const result = await getRepo().addCategory('plan1', 'cat3')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('plan1', {
        categoryIds: ['cat1', 'cat2', 'cat3']
      })
      expect(result.categoryIds).toContain('cat3')
    })

    it('should return plan unchanged if category already exists', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)

      const result = await getRepo().addCategory('plan1', 'cat1')

      expect(mockPb.mockCollection.update).not.toHaveBeenCalled()
      expect(result.categoryIds).toContain('cat1')
    })

    it('should throw when plan not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      await expect(getRepo().addCategory('nonexistent', 'cat1')).rejects.toThrow(
        'Evaluation plan not found'
      )
    })
  })

  describe('removeCategory', () => {
    it('should remove a category from the plan', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({
        ...MOCK_RECORD,
        categoryIds: ['cat1']
      })

      await getRepo().removeCategory('plan1', 'cat2')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('plan1', {
        categoryIds: ['cat1']
      })
    })

    it('should throw when plan not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      await expect(getRepo().removeCategory('nonexistent', 'cat1')).rejects.toThrow(
        'Evaluation plan not found'
      )
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('plan1')

      expect(result?.editionId).toBe('edition1')
      expect(result?.description).toBe('Review technical talks')
      expect(result?.categoryIds).toEqual(['cat1', 'cat2'])
      expect(result?.reviewerIds).toEqual(['user1', 'user2'])
      expect(result?.isActive).toBe(true)
      expect(result?.createdBy).toBe('admin1')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing arrays with defaults', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        ...MOCK_RECORD,
        categoryIds: null,
        reviewerIds: null,
        description: ''
      })
      const result = await getRepo().findById('plan1')

      expect(result?.categoryIds).toEqual([])
      expect(result?.reviewerIds).toEqual([])
      expect(result?.description).toBeUndefined()
    })
  })
})
