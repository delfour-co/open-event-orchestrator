import { describe, expect, it, vi } from 'vitest'
import { createAlertRepository } from './alert-repository'

const NOW = new Date().toISOString()

const createMockRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'alert-1',
  editionId: 'ed-1',
  thresholdId: 'th-1',
  title: 'Low ticket sales',
  message: 'Ticket sales below threshold',
  level: 'warning',
  metricSource: 'billing_sales',
  currentValue: 10,
  thresholdValue: 50,
  status: 'active',
  acknowledgedBy: undefined,
  acknowledgedAt: undefined,
  resolvedAt: undefined,
  dismissedBy: undefined,
  dismissedAt: undefined,
  created: NOW,
  updated: NOW,
  ...overrides
})

const createMockPocketBase = () => {
  const mockRecord = createMockRecord()
  return {
    collection: vi.fn().mockReturnValue({
      getOne: vi.fn().mockResolvedValue(mockRecord),
      getList: vi.fn().mockResolvedValue({ items: [mockRecord], totalItems: 1, totalPages: 1 }),
      getFullList: vi.fn().mockResolvedValue([mockRecord]),
      create: vi.fn().mockResolvedValue(mockRecord),
      update: vi.fn().mockResolvedValue(mockRecord),
      delete: vi.fn().mockResolvedValue(undefined)
    }),
    mockRecord
  }
}

describe('createAlertRepository', () => {
  describe('findById', () => {
    it('returns alert when found', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const result = await repo.findById('alert-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('alert-1')
      expect(result?.title).toBe('Low ticket sales')
      expect(result?.level).toBe('warning')
    })

    it('returns null when not found', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const result = await repo.findById('invalid')

      expect(result).toBeNull()
    })

    it('maps date fields correctly', async () => {
      const ackDate = '2024-06-01T10:00:00Z'
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(
            createMockRecord({
              acknowledgedAt: ackDate,
              acknowledgedBy: 'user-1'
            })
          )
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const result = await repo.findById('alert-1')

      expect(result?.acknowledgedAt).toEqual(new Date(ackDate))
      expect(result?.acknowledgedBy).toBe('user-1')
    })
  })

  describe('findByEdition', () => {
    it('returns alerts for edition', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const results = await repo.findByEdition('ed-1')

      expect(results).toHaveLength(1)
      expect(results[0].editionId).toBe('ed-1')
    })

    it('filters by status when provided as array', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      await repo.findByEdition('ed-1', { status: ['active', 'acknowledged'] })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('status')
        })
      )
    })

    it('filters by level when provided', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      await repo.findByEdition('ed-1', { level: 'critical' })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('level')
        })
      )
    })

    it('uses custom pagination and sort', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      await repo.findByEdition('ed-1', { page: 2, perPage: 10, sort: 'level' })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        2,
        10,
        expect.objectContaining({ sort: 'level' })
      )
    })
  })

  describe('findActiveByEdition', () => {
    it('returns active and acknowledged alerts', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const results = await repo.findActiveByEdition('ed-1')

      expect(results).toHaveLength(1)
      expect(collection().getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('active'),
          sort: '-created'
        })
      )
    })
  })

  describe('findByThreshold', () => {
    it('returns alerts for threshold', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const results = await repo.findByThreshold('th-1')

      expect(results).toHaveLength(1)
      expect(collection().getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('th-1')
        })
      )
    })
  })

  describe('findActiveByThreshold', () => {
    it('returns active alert for threshold', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const result = await repo.findActiveByThreshold('th-1')

      expect(result).not.toBeNull()
      expect(result?.thresholdId).toBe('th-1')
    })

    it('returns null when no active alert', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const result = await repo.findActiveByThreshold('th-1')

      expect(result).toBeNull()
    })

    it('returns null on error', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockRejectedValue(new Error('error'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const result = await repo.findActiveByThreshold('th-1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates alert with active status', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      const data = {
        editionId: 'ed-1',
        thresholdId: 'th-1',
        title: 'Alert',
        message: 'Msg',
        level: 'warning' as const,
        metricSource: 'billing_sales' as const,
        currentValue: 10,
        thresholdValue: 50
      }

      await repo.create(data)

      expect(collection().create).toHaveBeenCalledWith(
        expect.objectContaining({ ...data, status: 'active' })
      )
    })
  })

  describe('acknowledge', () => {
    it('updates status to acknowledged', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      await repo.acknowledge('alert-1', 'user-1')

      expect(collection().update).toHaveBeenCalledWith(
        'alert-1',
        expect.objectContaining({
          status: 'acknowledged',
          acknowledgedBy: 'user-1',
          acknowledgedAt: expect.any(String)
        })
      )
    })
  })

  describe('resolve', () => {
    it('updates status to resolved', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      await repo.resolve('alert-1')

      expect(collection().update).toHaveBeenCalledWith(
        'alert-1',
        expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(String)
        })
      )
    })
  })

  describe('dismiss', () => {
    it('updates status to dismissed', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository({ collection } as any)

      await repo.dismiss('alert-1', 'user-1')

      expect(collection().update).toHaveBeenCalledWith(
        'alert-1',
        expect.objectContaining({
          status: 'dismissed',
          dismissedBy: 'user-1',
          dismissedAt: expect.any(String)
        })
      )
    })
  })

  describe('countByEdition', () => {
    it('returns total and counts by status and level', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([
            { status: 'active', level: 'warning' },
            { status: 'active', level: 'critical' },
            { status: 'resolved', level: 'info' }
          ])
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const result = await repo.countByEdition('ed-1')

      expect(result.total).toBe(3)
      expect(result.byStatus.active).toBe(2)
      expect(result.byStatus.resolved).toBe(1)
      expect(result.byLevel.warning).toBe(1)
      expect(result.byLevel.critical).toBe(1)
      expect(result.byLevel.info).toBe(1)
    })
  })

  describe('countActiveByEdition', () => {
    it('returns count of active alerts', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ totalItems: 5 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertRepository(pb as any)

      const count = await repo.countActiveByEdition('ed-1')

      expect(count).toBe(5)
    })
  })
})
