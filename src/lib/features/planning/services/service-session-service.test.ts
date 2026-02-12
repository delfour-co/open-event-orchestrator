import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createServiceSessionService } from './service-session-service'

describe('service-session-service', () => {
  let mockPb: PocketBase

  const mockSessionRecord = {
    id: 'session-1',
    editionId: 'edition-1',
    type: 'break',
    title: 'Coffee Break',
    description: 'Take a break',
    icon: 'coffee',
    color: '#9CA3AF',
    date: '2024-06-15T00:00:00Z',
    startTime: '10:00',
    endTime: '10:30',
    isGlobal: true,
    roomIds: null,
    isPublic: true,
    sortOrder: 0,
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should create a service session', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue(mockSessionRecord)
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.create({
        editionId: 'edition-1',
        type: 'break',
        title: 'Coffee Break',
        date: new Date('2024-06-15'),
        startTime: '10:00',
        endTime: '10:30',
        isGlobal: true,
        isPublic: true,
        sortOrder: 0
      })

      expect(result.title).toBe('Coffee Break')
      expect(result.type).toBe('break')
    })
  })

  describe('createFromTemplate', () => {
    it('should create a session using a template', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue({
            ...mockSessionRecord,
            title: 'Lunch Break',
            type: 'lunch',
            icon: 'utensils',
            endTime: '11:00'
          })
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.createFromTemplate(
        'edition-1',
        'lunch',
        new Date('2024-06-15'),
        '10:00'
      )

      expect(result.type).toBe('lunch')
    })
  })

  describe('update', () => {
    it('should update a service session', async () => {
      const updatedRecord = { ...mockSessionRecord, title: 'Morning Coffee' }
      mockPb = {
        collection: vi.fn().mockReturnValue({
          update: vi.fn().mockResolvedValue(updatedRecord)
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.update('session-1', { title: 'Morning Coffee' })

      expect(result.title).toBe('Morning Coffee')
    })
  })

  describe('remove', () => {
    it('should delete a service session', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb = {
        collection: vi.fn().mockReturnValue({
          delete: mockDelete
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      await service.remove('session-1')

      expect(mockDelete).toHaveBeenCalledWith('session-1')
    })
  })

  describe('getById', () => {
    it('should return service session by ID', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(mockSessionRecord)
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.getById('session-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('session-1')
    })

    it('should return null when not found', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.getById('invalid')

      expect(result).toBeNull()
    })
  })

  describe('listByEdition', () => {
    it('should list all service sessions for edition', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([mockSessionRecord])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listByEdition('edition-1')

      expect(result).toHaveLength(1)
      expect(result[0].editionId).toBe('edition-1')
    })
  })

  describe('listByDate', () => {
    it('should list service sessions for a specific date', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([mockSessionRecord])
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: mockGetFullList
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listByDate('edition-1', new Date('2024-06-15'))

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('2024-06-15')
        })
      )
    })
  })

  describe('listForRoom', () => {
    it('should include global sessions', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([{ ...mockSessionRecord, isGlobal: true }])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listForRoom('edition-1', 'room-1')

      expect(result).toHaveLength(1)
    })

    it('should include room-specific sessions for matching room', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi
            .fn()
            .mockResolvedValue([{ ...mockSessionRecord, isGlobal: false, roomIds: ['room-1'] }])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listForRoom('edition-1', 'room-1')

      expect(result).toHaveLength(1)
    })

    it('should exclude room-specific sessions for non-matching room', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi
            .fn()
            .mockResolvedValue([{ ...mockSessionRecord, isGlobal: false, roomIds: ['room-1'] }])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listForRoom('edition-1', 'room-2')

      expect(result).toHaveLength(0)
    })
  })

  describe('listPublic', () => {
    it('should only return public sessions', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([
            { ...mockSessionRecord, isPublic: true },
            { ...mockSessionRecord, id: 'session-2', isPublic: false }
          ])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.listPublic('edition-1')

      expect(result).toHaveLength(1)
      expect(result[0].isPublic).toBe(true)
    })
  })

  describe('duplicate', () => {
    it('should duplicate a session to a new date', async () => {
      const duplicatedRecord = {
        ...mockSessionRecord,
        id: 'session-2',
        date: '2024-06-16T00:00:00Z'
      }

      mockPb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(mockSessionRecord),
          create: vi.fn().mockResolvedValue(duplicatedRecord)
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.duplicate('session-1', new Date('2024-06-16'))

      expect(result.id).toBe('session-2')
      expect(result.date.toISOString()).toContain('2024-06-16')
    })

    it('should throw error if session not found', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)

      await expect(service.duplicate('invalid', new Date())).rejects.toThrow(
        'Service session not found'
      )
    })
  })

  describe('bulkCreateForDates', () => {
    it('should create sessions for multiple dates', async () => {
      let callCount = 0
      mockPb = {
        collection: vi.fn().mockReturnValue({
          create: vi.fn().mockImplementation(() => {
            callCount++
            return Promise.resolve({
              ...mockSessionRecord,
              id: `session-${callCount}`,
              date: `2024-06-${14 + callCount}T00:00:00Z`
            })
          })
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.bulkCreateForDates(
        'edition-1',
        'break',
        [new Date('2024-06-15'), new Date('2024-06-16'), new Date('2024-06-17')],
        '10:00'
      )

      expect(result).toHaveLength(3)
    })
  })

  describe('getGroupedByDate', () => {
    it('should group sessions by date', async () => {
      mockPb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([
            { ...mockSessionRecord, date: '2024-06-15T00:00:00Z' },
            { ...mockSessionRecord, id: 'session-2', date: '2024-06-15T00:00:00Z' },
            { ...mockSessionRecord, id: 'session-3', date: '2024-06-16T00:00:00Z' }
          ])
        })
      } as unknown as PocketBase

      const service = createServiceSessionService(mockPb)
      const result = await service.getGroupedByDate('edition-1')

      expect(result.size).toBe(2)
      expect(result.get('2024-06-15')).toHaveLength(2)
      expect(result.get('2024-06-16')).toHaveLength(1)
    })
  })
})
