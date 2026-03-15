import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuditLogRepository } from './audit-log-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterEquals: (field: string, value: string) => `${field} = "${value}"`,
  filterContains: (field: string, value: string) => `${field} ~ "${value}"`,
  filterAnd: (...conditions: (string | null | undefined)[]) =>
    conditions.filter((c): c is string => !!c && c.trim() !== '').join(' && ')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeAuditLogRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'log1',
  editionId: 'edition1',
  userId: 'user1',
  action: 'create',
  entityType: 'transaction',
  entityId: 'tx1',
  entityReference: 'INV-001',
  oldValue: null,
  newValue: { amount: 500 },
  metadata: { source: 'manual' },
  created: '2024-01-01T00:00:00Z',
  ...overrides
})

describe('AuditLogRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return audit log by id', async () => {
      const record = makeAuditLogRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('log1')

      expect(result?.action).toBe('create')
      expect(result?.entityType).toBe('transaction')
      expect(result?.entityId).toBe('tx1')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return paginated audit logs', async () => {
      const records = [makeAuditLogRecord()]
      const mockGetList = vi.fn().mockResolvedValue({
        items: records,
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result.items).toHaveLength(1)
      expect(result.page).toBe(1)
      expect(result.totalItems).toBe(1)
    })

    it('should apply filters when provided', async () => {
      const records = [makeAuditLogRecord()]
      const mockGetList = vi.fn().mockResolvedValue({
        items: records,
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findByEdition('edition1', { action: 'create', entityType: 'transaction' }, 2, 25)

      expect(mockGetList).toHaveBeenCalledWith(
        2,
        25,
        expect.objectContaining({
          sort: '-created'
        })
      )
    })

    it('should support date range filters', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        perPage: 50,
        totalItems: 0,
        totalPages: 0
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findByEdition('edition1', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })

      expect(mockGetList).toHaveBeenCalled()
    })
  })

  describe('findByEntity', () => {
    it('should return logs for a specific entity', async () => {
      const records = [makeAuditLogRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEntity('transaction', 'tx1')

      expect(result).toHaveLength(1)
      expect(result[0].entityId).toBe('tx1')
    })
  })

  describe('findAllByEdition', () => {
    it('should return all logs for an edition without pagination', async () => {
      const records = [makeAuditLogRecord(), makeAuditLogRecord({ id: 'log2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAllByEdition('edition1')

      expect(result).toHaveLength(2)
    })

    it('should apply filters', async () => {
      const records = [makeAuditLogRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findAllByEdition('edition1', { userId: 'user1' })

      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: '-created'
        })
      )
    })
  })

  describe('create', () => {
    it('should create an audit log entry', async () => {
      const record = makeAuditLogRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        userId: 'user1',
        action: 'create',
        entityType: 'transaction',
        entityId: 'tx1',
        entityReference: 'INV-001',
        newValue: { amount: 500 }
      })

      expect(result.action).toBe('create')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          action: 'create',
          entityType: 'transaction'
        }),
        { requestKey: null }
      )
    })

    it('should handle optional fields as null', async () => {
      const record = makeAuditLogRecord({
        userId: null,
        oldValue: null,
        newValue: null,
        metadata: null
      })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'edition1',
        action: 'delete',
        entityType: 'category',
        entityId: 'cat1'
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          oldValue: null,
          newValue: null,
          metadata: null
        }),
        { requestKey: null }
      )
    })
  })

  describe('countByEdition', () => {
    it('should return count of logs for an edition', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 42 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEdition('edition1')

      expect(result).toBe(42)
    })
  })
})
