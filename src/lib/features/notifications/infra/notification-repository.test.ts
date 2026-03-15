import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotificationRepository } from './notification-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeNotificationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif1',
  userId: 'user1',
  type: 'system',
  title: 'Welcome',
  message: 'Welcome to the platform',
  isRead: false,
  link: '/dashboard',
  metadata: null,
  deletedAt: null,
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('NotificationRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return a notification when found', async () => {
      const record = makeNotificationRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('notif1')

      expect(result?.id).toBe('notif1')
      expect(result?.title).toBe('Welcome')
      expect(result?.isRead).toBe(false)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByUser', () => {
    it('should return paginated notifications for a user', async () => {
      const records = {
        items: [makeNotificationRecord()],
        totalItems: 1,
        totalPages: 1
      }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByUser('user1')

      expect(result.items).toHaveLength(1)
      expect(result.totalItems).toBe(1)
    })

    it('should apply type filter when specified', async () => {
      const records = { items: [], totalItems: 0, totalPages: 0 }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.findByUser('user1', { type: 'alert' })

      expect(mockGetList).toHaveBeenCalled()
    })

    it('should apply isRead filter when specified', async () => {
      const records = { items: [], totalItems: 0, totalPages: 0 }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.findByUser('user1', { isRead: false })

      expect(mockGetList).toHaveBeenCalled()
    })

    it('should use custom pagination', async () => {
      const records = { items: [], totalItems: 0, totalPages: 0 }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.findByUser('user1', { page: 2, perPage: 10 })

      expect(mockGetList).toHaveBeenCalledWith(2, 10, expect.any(Object))
    })
  })

  describe('findRecentByUser', () => {
    it('should return recent notifications with default limit', async () => {
      const records = {
        items: [makeNotificationRecord()],
        totalItems: 1,
        totalPages: 1
      }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.findRecentByUser('user1')

      expect(result).toHaveLength(1)
      expect(mockGetList).toHaveBeenCalledWith(1, 10, expect.any(Object))
    })

    it('should accept custom limit', async () => {
      const records = { items: [], totalItems: 0, totalPages: 0 }
      const mockGetList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.findRecentByUser('user1', 5)

      expect(mockGetList).toHaveBeenCalledWith(1, 5, expect.any(Object))
    })
  })

  describe('countByUser', () => {
    it('should return counts by type and unread count', async () => {
      const records = [
        { type: 'system', isRead: false },
        { type: 'system', isRead: true },
        { type: 'alert', isRead: false },
        { type: 'reminder', isRead: false }
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByUser('user1')

      expect(result.total).toBe(4)
      expect(result.unread).toBe(3)
      expect(result.byType.system).toBe(2)
      expect(result.byType.alert).toBe(1)
      expect(result.byType.reminder).toBe(1)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 7 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUnreadCount('user1')

      expect(result).toBe(7)
    })
  })

  describe('create', () => {
    it('should create a notification', async () => {
      const record = makeNotificationRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        userId: 'user1',
        type: 'system',
        title: 'Welcome',
        message: 'Welcome to the platform'
      })

      expect(result?.title).toBe('Welcome')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: false,
          deletedAt: null
        })
      )
    })

    it('should stringify metadata when provided', async () => {
      const record = makeNotificationRecord({ metadata: '{"key":"value"}' })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.create({
        userId: 'user1',
        type: 'system',
        title: 'Test',
        message: 'Test',
        metadata: { key: 'value' }
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: JSON.stringify({ key: 'value' })
        })
      )
    })
  })

  describe('createMany', () => {
    it('should create multiple notifications', async () => {
      const record1 = makeNotificationRecord({ id: 'n1' })
      const record2 = makeNotificationRecord({ id: 'n2' })
      const mockCreate = vi.fn().mockResolvedValueOnce(record1).mockResolvedValueOnce(record2)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.createMany([
        { userId: 'user1', type: 'system', title: 'N1', message: 'M1' },
        { userId: 'user2', type: 'alert', title: 'N2', message: 'M2' }
      ])

      expect(result).toHaveLength(2)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const record = makeNotificationRecord({ isRead: true })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.markAsRead('notif1')

      expect(result?.isRead).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith('notif1', { isRead: true })
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const records = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        update: mockUpdate
      })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const count = await repo.markAllAsRead('user1')

      expect(count).toBe(3)
      expect(mockUpdate).toHaveBeenCalledTimes(3)
    })
  })

  describe('softDelete', () => {
    it('should set deletedAt timestamp', async () => {
      const record = makeNotificationRecord({ deletedAt: '2024-06-15T12:00:00Z' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const result = await repo.softDelete('notif1')

      expect(result?.deletedAt).toBeInstanceOf(Date)
      expect(mockUpdate).toHaveBeenCalledWith(
        'notif1',
        expect.objectContaining({ deletedAt: expect.any(String) })
      )
    })
  })

  describe('softDeleteOlderThan', () => {
    it('should soft delete notifications older than given date', async () => {
      const records = [{ id: 'n1' }, { id: 'n2' }]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        update: mockUpdate
      })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const count = await repo.softDeleteOlderThan('user1', new Date('2024-01-01'))

      expect(count).toBe(2)
      expect(mockUpdate).toHaveBeenCalledTimes(2)
    })
  })

  describe('permanentlyDelete', () => {
    it('should permanently delete a notification', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.permanentlyDelete('notif1')

      expect(mockDelete).toHaveBeenCalledWith('notif1')
    })
  })

  describe('cleanupDeleted', () => {
    it('should permanently delete old soft-deleted notifications', async () => {
      const records = [{ id: 'n1' }, { id: 'n2' }]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete
      })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      const count = await repo.cleanupDeleted(30)

      expect(count).toBe(2)
      expect(mockDelete).toHaveBeenCalledTimes(2)
    })

    it('should use default 30 day threshold', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      const mockDelete = vi.fn()
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete
      })

      const repo = createNotificationRepository(mockPb as unknown as PocketBase)
      await repo.cleanupDeleted()

      expect(mockGetFullList).toHaveBeenCalled()
    })
  })
})
