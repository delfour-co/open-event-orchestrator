import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuditLogRepository } from './audit-log-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeAuditLogRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'log1',
  organizationId: 'org1',
  userId: 'user1',
  userName: 'John Doe',
  action: 'member_add',
  entityType: 'member',
  entityId: 'member1',
  entityName: 'Jane Smith',
  details: { role: 'organizer' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('AuditLogRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create an audit log record and map the result', async () => {
      const record = makeAuditLogRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        organizationId: 'org1',
        userId: 'user1',
        userName: 'John Doe',
        action: 'member_add',
        entityType: 'member',
        entityId: 'member1',
        entityName: 'Jane Smith',
        details: { role: 'organizer' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('audit_logs')
      expect(result.id).toBe('log1')
      expect(result.organizationId).toBe('org1')
      expect(result.userId).toBe('user1')
      expect(result.userName).toBe('John Doe')
      expect(result.action).toBe('member_add')
      expect(result.entityType).toBe('member')
      expect(result.entityId).toBe('member1')
      expect(result.entityName).toBe('Jane Smith')
      expect(result.details).toEqual({ role: 'organizer' })
      expect(result.ipAddress).toBe('192.168.1.1')
      expect(result.created).toEqual(new Date('2024-06-15T10:00:00Z'))
    })

    it('should map empty optional fields to undefined', async () => {
      const record = makeAuditLogRecord({
        userId: '',
        userName: '',
        entityType: '',
        entityId: '',
        entityName: '',
        details: null,
        ipAddress: '',
        userAgent: ''
      })
      mockPb._mockCollection.mockReturnValue({
        create: vi.fn().mockResolvedValue(record)
      })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        organizationId: 'org1',
        action: 'login'
      } as never)

      expect(result.userId).toBeUndefined()
      expect(result.userName).toBeUndefined()
      expect(result.entityType).toBeUndefined()
      expect(result.entityId).toBeUndefined()
      expect(result.entityName).toBeUndefined()
      expect(result.details).toBeUndefined()
      expect(result.ipAddress).toBeUndefined()
      expect(result.userAgent).toBeUndefined()
    })
  })

  describe('findByOrganization', () => {
    it('should return paginated audit logs with retention filter', async () => {
      const records = [makeAuditLogRecord()]
      const mockGetList = vi.fn().mockResolvedValue({
        items: records,
        page: 1,
        perPage: 25,
        totalItems: 1,
        totalPages: 1
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('audit_logs')
      expect(mockGetList).toHaveBeenCalledWith(1, 25, {
        filter: expect.stringContaining('organizationId="org1"'),
        sort: '-created'
      })
      // Should include retention filter
      const filter = mockGetList.mock.calls[0][2].filter
      expect(filter).toContain('created >=')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].id).toBe('log1')
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(25)
      expect(result.totalItems).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('should apply custom pagination', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [],
        page: 2,
        perPage: 10,
        totalItems: 15,
        totalPages: 2
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org1', undefined, 2, 10)

      expect(mockGetList).toHaveBeenCalledWith(2, 10, expect.any(Object))
      expect(result.page).toBe(2)
      expect(result.perPage).toBe(10)
    })

    it('should apply action filter', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        perPage: 25,
        totalItems: 0,
        totalPages: 0
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findByOrganization('org1', { action: 'login' })

      const filter = mockGetList.mock.calls[0][2].filter
      expect(filter).toContain('action="login"')
    })

    it('should apply userId filter', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        perPage: 25,
        totalItems: 0,
        totalPages: 0
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findByOrganization('org1', { userId: 'user1' })

      const filter = mockGetList.mock.calls[0][2].filter
      expect(filter).toContain('userId="user1"')
    })

    it('should apply date range filters', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [],
        page: 1,
        perPage: 25,
        totalItems: 0,
        totalPages: 0
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.findByOrganization('org1', {
        startDate: new Date('2024-06-01T00:00:00Z'),
        endDate: new Date('2024-06-30T23:59:59Z')
      })

      const filter = mockGetList.mock.calls[0][2].filter
      // startDate and endDate produce created >= and created <= filters
      expect(filter).toContain('created >= "2024-06-01')
      expect(filter).toContain('created <= "2024-06-30')
    })
  })

  describe('exportCsv', () => {
    it('should return CSV with headers and data rows', async () => {
      const records = [
        makeAuditLogRecord(),
        makeAuditLogRecord({
          id: 'log2',
          userName: 'Alice',
          action: 'event_create',
          entityType: 'event',
          entityName: 'My Event',
          ipAddress: '10.0.0.1'
        })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const csv = await repo.exportCsv('org1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('audit_logs')
      expect(mockGetFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('organizationId="org1"'),
        sort: '-created'
      })

      const lines = csv.split('\n')
      expect(lines[0]).toBe('Date,User,Action,Entity Type,Entity Name,IP Address')
      expect(lines).toHaveLength(3) // header + 2 data rows
      expect(lines[1]).toContain('"John Doe"')
      expect(lines[1]).toContain('"member_add"')
      expect(lines[1]).toContain('"member"')
      expect(lines[2]).toContain('"Alice"')
      expect(lines[2]).toContain('"event_create"')
    })

    it('should handle empty optional fields in CSV export', async () => {
      const records = [
        makeAuditLogRecord({
          userName: '',
          entityType: '',
          entityName: '',
          ipAddress: ''
        })
      ]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const csv = await repo.exportCsv('org1')

      const lines = csv.split('\n')
      expect(lines[1]).toContain('""')
    })

    it('should apply filters to CSV export', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      await repo.exportCsv('org1', { action: 'login' })

      const filter = mockGetFullList.mock.calls[0][0].filter
      expect(filter).toContain('action="login"')
    })

    it('should return only headers when no records exist', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createAuditLogRepository(mockPb as unknown as PocketBase)
      const csv = await repo.exportCsv('org1')

      expect(csv).toBe('Date,User,Action,Entity Type,Entity Name,IP Address')
    })
  })
})
