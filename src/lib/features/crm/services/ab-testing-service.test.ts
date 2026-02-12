import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAbTestingService } from './ab-testing-service'

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
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
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

describe('AbTestingService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createAbTestingService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createAbTestingService(pb)
  })

  describe('createTest', () => {
    it('should create an A/B test campaign', async () => {
      const result = await service.createTest({
        eventId: 'evt-1',
        name: 'Subject Line Test',
        testVariable: 'subject',
        winnerCriteria: 'open_rate'
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('ab_test_campaigns').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-1',
          name: 'Subject Line Test',
          testVariable: 'subject',
          winnerCriteria: 'open_rate',
          status: 'draft',
          testPercentage: 20,
          testDurationHours: 24
        })
      )
    })

    it('should use custom test parameters', async () => {
      await service.createTest({
        eventId: 'evt-1',
        name: 'Test',
        testVariable: 'content',
        winnerCriteria: 'click_rate',
        testPercentage: 30,
        testDurationHours: 48
      })

      expect(pb.collection('ab_test_campaigns').create).toHaveBeenCalledWith(
        expect.objectContaining({
          testPercentage: 30,
          testDurationHours: 48
        })
      )
    })
  })

  describe('updateTest', () => {
    it('should update test configuration', async () => {
      await service.updateTest('t1', { name: 'Updated Name', testPercentage: 25 })

      expect(pb.collection('ab_test_campaigns').update).toHaveBeenCalledWith('t1', {
        name: 'Updated Name',
        testPercentage: 25
      })
    })
  })

  describe('deleteTest', () => {
    it('should delete a test', async () => {
      await service.deleteTest('t1')

      expect(pb.collection('ab_test_campaigns').delete).toHaveBeenCalledWith('t1')
    })
  })

  describe('getTest', () => {
    it('should return test by id', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        eventId: 'evt-1',
        name: 'Test',
        testVariable: 'subject',
        winnerCriteria: 'open_rate',
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.getTest('t1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('t1')
    })

    it('should return null for non-existent test', async () => {
      pb.collection('ab_test_campaigns').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getTest('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getTestsByEvent', () => {
    it('should return tests for event', async () => {
      pb.collection('ab_test_campaigns').getFullList.mockResolvedValue([
        {
          id: 't1',
          eventId: 'evt-1',
          name: 'Test 1',
          testVariable: 'subject',
          winnerCriteria: 'open_rate',
          status: 'draft',
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getTestsByEvent('evt-1')

      expect(result).toHaveLength(1)
    })

    it('should filter by status', async () => {
      await service.getTestsByEvent('evt-1', 'testing')

      expect(pb.collection('ab_test_campaigns').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('testing')
        })
      )
    })
  })

  describe('createVariant', () => {
    it('should create a variant', async () => {
      const result = await service.createVariant({
        testId: 't1',
        name: 'A',
        subject: 'Subject A',
        htmlContent: '<p>Content A</p>'
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('ab_test_variants').create).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 't1',
          name: 'A',
          subject: 'Subject A',
          isWinner: false
        })
      )
    })
  })

  describe('updateVariant', () => {
    it('should update variant content', async () => {
      await service.updateVariant('v1', { subject: 'New Subject' })

      expect(pb.collection('ab_test_variants').update).toHaveBeenCalledWith('v1', {
        subject: 'New Subject'
      })
    })
  })

  describe('getVariants', () => {
    it('should return variants for test', async () => {
      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        {
          id: 'v1',
          testId: 't1',
          name: 'A',
          subject: 'Subject A',
          htmlContent: '<p>A</p>',
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'v2',
          testId: 't1',
          name: 'B',
          subject: 'Subject B',
          htmlContent: '<p>B</p>',
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getVariants('t1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('A')
      expect(result[1].name).toBe('B')
    })
  })

  describe('startTest', () => {
    it('should start a valid test', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'draft',
        totalRecipients: 0,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        { id: 'v1', name: 'A', created: now.toISOString(), updated: now.toISOString() },
        { id: 'v2', name: 'B', created: now.toISOString(), updated: now.toISOString() }
      ])

      const result = await service.startTest('t1', 1000)

      expect(result.success).toBe(true)
      expect(pb.collection('ab_test_campaigns').update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          status: 'testing',
          totalRecipients: 1000
        })
      )
    })

    it('should reject test with insufficient variants', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        { id: 'v1', name: 'A', created: now.toISOString(), updated: now.toISOString() }
      ])

      const result = await service.startTest('t1', 1000)

      expect(result.success).toBe(false)
      expect(result.error).toContain('2 variants')
    })

    it('should reject non-draft test', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'testing',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.startTest('t1', 1000)

      expect(result.success).toBe(false)
      expect(result.error).toContain('draft')
    })
  })

  describe('selectWinner', () => {
    it('should select winner variant', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'testing',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        { id: 'v1', name: 'A', created: now.toISOString(), updated: now.toISOString() },
        { id: 'v2', name: 'B', created: now.toISOString(), updated: now.toISOString() }
      ])

      const result = await service.selectWinner('t1', 'v1')

      expect(result.success).toBe(true)
      expect(pb.collection('ab_test_variants').update).toHaveBeenCalledWith('v1', {
        isWinner: true
      })
      expect(pb.collection('ab_test_variants').update).toHaveBeenCalledWith('v2', {
        isWinner: false
      })
      expect(pb.collection('ab_test_campaigns').update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          status: 'winner_selected',
          winnerVariantId: 'v1'
        })
      )
    })

    it('should reject when not testing', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'draft',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.selectWinner('t1', 'v1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('testing')
    })
  })

  describe('cancelTest', () => {
    it('should cancel a test', async () => {
      await service.cancelTest('t1')

      expect(pb.collection('ab_test_campaigns').update).toHaveBeenCalledWith('t1', {
        status: 'cancelled'
      })
    })
  })

  describe('completeTest', () => {
    it('should complete a test', async () => {
      await service.completeTest('t1')

      expect(pb.collection('ab_test_campaigns').update).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({
          status: 'completed'
        })
      )
    })
  })

  describe('getResults', () => {
    it('should return test results with variant stats', async () => {
      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'testing',
        testStartedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        totalRecipients: 1000,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        {
          id: 'v1',
          name: 'A',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 95,
          openedCount: 40,
          clickedCount: 10,
          bouncedCount: 5,
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'v2',
          name: 'B',
          recipientCount: 100,
          sentCount: 100,
          deliveredCount: 98,
          openedCount: 50,
          clickedCount: 15,
          bouncedCount: 2,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getResults('t1')

      expect(result).not.toBeNull()
      expect(result?.variants).toHaveLength(2)
      expect(result?.variants[0].openRate).toBeGreaterThan(0)
      expect(result?.totalRecipients).toBe(1000)
    })

    it('should return null for non-existent test', async () => {
      pb.collection('ab_test_campaigns').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getResults('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('checkAndSelectWinner', () => {
    it('should auto-select winner when duration elapsed', async () => {
      const startedAt = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago

      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'testing',
        testStartedAt: startedAt.toISOString(),
        testDurationHours: 24,
        winnerCriteria: 'open_rate',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('ab_test_variants').getFullList.mockResolvedValue([
        {
          id: 'v1',
          name: 'A',
          deliveredCount: 95,
          openedCount: 40,
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'v2',
          name: 'B',
          deliveredCount: 95,
          openedCount: 50,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.checkAndSelectWinner('t1')

      expect(result.selected).toBe(true)
      expect(result.variantId).toBe('v2') // Higher open rate
    })

    it('should not select winner when duration not elapsed', async () => {
      const startedAt = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago

      pb.collection('ab_test_campaigns').getOne.mockResolvedValue({
        id: 't1',
        status: 'testing',
        testStartedAt: startedAt.toISOString(),
        testDurationHours: 24,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.checkAndSelectWinner('t1')

      expect(result.selected).toBe(false)
    })
  })

  describe('updateVariantStats', () => {
    it('should update variant statistics', async () => {
      await service.updateVariantStats('v1', {
        sentCount: 100,
        deliveredCount: 95,
        openedCount: 40
      })

      expect(pb.collection('ab_test_variants').update).toHaveBeenCalledWith('v1', {
        sentCount: 100,
        deliveredCount: 95,
        openedCount: 40
      })
    })
  })
})
