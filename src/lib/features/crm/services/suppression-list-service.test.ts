import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SUPPRESSION_CONFIG } from '../domain/suppression-list'
import { createSuppressionListService } from './suppression-list-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString()
      })
    ),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('SuppressionListService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createSuppressionListService>

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createSuppressionListService(pb)
  })

  describe('isEmailSuppressed', () => {
    it('should return false when email is not suppressed', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const result = await service.isEmailSuppressed('test@example.com')

      expect(result.isSuppressed).toBe(false)
    })

    it('should return true when email is suppressed', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({
        items: [
          {
            id: 's1',
            email: 'test@example.com',
            reason: 'hard_bounce',
            source: 'campaign-1',
            created: '2024-01-01T00:00:00Z'
          }
        ]
      })

      const result = await service.isEmailSuppressed('test@example.com')

      expect(result.isSuppressed).toBe(true)
      expect(result.entry?.reason).toBe('hard_bounce')
    })

    it('should normalize email for comparison', async () => {
      await service.isEmailSuppressed('  TEST@EXAMPLE.COM  ')

      expect(pb.collection('suppression_list').getList).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({
          filter: expect.stringContaining('test@example.com')
        })
      )
    })
  })

  describe('filterSuppressed', () => {
    it('should return empty array for no suppressed emails', async () => {
      pb.collection('suppression_list').getFullList.mockResolvedValue([])

      const result = await service.filterSuppressed(['a@test.com', 'b@test.com'])

      expect(result).toEqual([])
    })

    it('should return suppressed emails', async () => {
      pb.collection('suppression_list').getFullList.mockResolvedValue([
        { email: 'a@test.com' },
        { email: 'c@test.com' }
      ])

      const result = await service.filterSuppressed(['a@test.com', 'b@test.com', 'c@test.com'])

      expect(result).toContain('a@test.com')
      expect(result).toContain('c@test.com')
      expect(result).not.toContain('b@test.com')
    })

    it('should handle empty input', async () => {
      const result = await service.filterSuppressed([])

      expect(result).toEqual([])
      expect(pb.collection).not.toHaveBeenCalled()
    })
  })

  describe('addEntry', () => {
    it('should add new entry', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const result = await service.addEntry({
        email: 'test@example.com',
        reason: 'hard_bounce',
        source: 'campaign-1'
      })

      expect(pb.collection('suppression_list').create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          reason: 'hard_bounce',
          source: 'campaign-1'
        })
      )
      expect(result.email).toBe('test@example.com')
    })

    it('should not duplicate existing entry', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({
        items: [
          {
            id: 'existing',
            email: 'test@example.com',
            reason: 'hard_bounce',
            created: '2024-01-01T00:00:00Z'
          }
        ]
      })

      const result = await service.addEntry({
        email: 'test@example.com',
        reason: 'complaint'
      })

      expect(pb.collection('suppression_list').create).not.toHaveBeenCalled()
      expect(result.id).toBe('existing')
    })
  })

  describe('removeEntry', () => {
    it('should remove existing entry', async () => {
      pb.collection('suppression_list').getFullList.mockResolvedValue([{ id: 's1' }])

      const result = await service.removeEntry('test@example.com')

      expect(result).toBe(true)
      expect(pb.collection('suppression_list').delete).toHaveBeenCalledWith('s1')
    })

    it('should return false when entry does not exist', async () => {
      pb.collection('suppression_list').getFullList.mockResolvedValue([])

      const result = await service.removeEntry('notfound@example.com')

      expect(result).toBe(false)
      expect(pb.collection('suppression_list').delete).not.toHaveBeenCalled()
    })
  })

  describe('getEntries', () => {
    it('should return paginated entries', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({
        items: [
          {
            id: 's1',
            email: 'test@example.com',
            reason: 'hard_bounce',
            created: '2024-01-01T00:00:00Z'
          }
        ],
        totalItems: 1
      })

      const result = await service.getEntries({ page: 1, perPage: 10 })

      expect(result.entries).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter by reason', async () => {
      await service.getEntries({ reason: 'complaint' })

      expect(pb.collection('suppression_list').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('complaint')
        })
      )
    })
  })

  describe('importCsv', () => {
    it('should import valid emails', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const csv = `test1@example.com
test2@example.com`

      const result = await service.importCsv(csv, { reason: 'manual' })

      expect(result.added).toBe(2)
      expect(result.duplicates).toBe(0)
      expect(result.invalid).toBe(0)
      expect(pb.collection('suppression_list').create).toHaveBeenCalledTimes(2)
    })

    it('should skip duplicates', async () => {
      // First email exists, second doesn't
      pb.collection('suppression_list')
        .getList.mockResolvedValueOnce({
          items: [{ id: 's1', email: 'test1@example.com', reason: 'manual', created: '2024-01-01' }]
        })
        .mockResolvedValueOnce({ items: [] })

      const csv = `test1@example.com
test2@example.com`

      const result = await service.importCsv(csv, {})

      expect(result.added).toBe(1)
      expect(result.duplicates).toBe(1)
    })

    it('should report invalid emails', async () => {
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const csv = `valid@example.com
invalid-email`

      const result = await service.importCsv(csv, {})

      expect(result.added).toBe(1)
      expect(result.invalid).toBe(1)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('exportCsv', () => {
    it('should export entries as CSV', async () => {
      pb.collection('suppression_list').getFullList.mockResolvedValue([
        {
          id: 's1',
          email: 'test@example.com',
          reason: 'hard_bounce',
          source: 'campaign-1',
          created: '2024-01-01T00:00:00Z'
        }
      ])

      const csv = await service.exportCsv()

      expect(csv).toContain('email,reason,source,note,created_at')
      expect(csv).toContain('test@example.com')
      expect(csv).toContain('hard_bounce')
    })
  })

  describe('processBounce', () => {
    it('should increment bounce count for soft bounce', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        hardBounceCount: 0,
        softBounceCount: 0
      })

      await service.processBounce('c1', 'test@example.com', 'soft')

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          softBounceCount: 1,
          hardBounceCount: 0
        })
      )
    })

    it('should suppress after hard bounce threshold', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        hardBounceCount: SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD - 1,
        softBounceCount: 0
      })
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const suppressed = await service.processBounce('c1', 'test@example.com', 'hard', 'campaign-1')

      expect(suppressed).toBe(true)
      expect(pb.collection('suppression_list').create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          reason: 'hard_bounce'
        })
      )
      expect(pb.collection('contacts').update).toHaveBeenLastCalledWith('c1', {
        isSuppressed: true
      })
    })

    it('should suppress after soft bounce threshold', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        hardBounceCount: 0,
        softBounceCount: SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD - 1
      })
      pb.collection('suppression_list').getList.mockResolvedValue({ items: [] })

      const suppressed = await service.processBounce('c1', 'test@example.com', 'soft')

      expect(suppressed).toBe(true)
      expect(pb.collection('suppression_list').create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'soft_bounce_limit'
        })
      )
    })

    it('should not suppress below threshold', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        hardBounceCount: 0,
        softBounceCount: 0
      })

      const suppressed = await service.processBounce('c1', 'test@example.com', 'soft')

      expect(suppressed).toBe(false)
      expect(pb.collection('suppression_list').create).not.toHaveBeenCalled()
    })
  })
})
