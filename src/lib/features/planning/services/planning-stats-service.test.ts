import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPlanningStatsService } from './planning-stats-service'

describe('planning-stats-service', () => {
  let mockPb: PocketBase

  const mockSessions = [
    { id: 'session-1', slotId: 'slot-1', type: 'talk' },
    { id: 'session-2', slotId: 'slot-2', type: 'workshop' },
    { id: 'session-3', slotId: null, type: 'talk' },
    { id: 'session-4', slotId: 'slot-3', type: 'keynote' }
  ]

  const mockSlots = [
    {
      id: 'slot-1',
      roomId: 'room-1',
      date: '2024-06-15T00:00:00.000Z',
      startTime: '09:00',
      endTime: '10:00'
    },
    {
      id: 'slot-2',
      roomId: 'room-1',
      date: '2024-06-15T00:00:00.000Z',
      startTime: '10:00',
      endTime: '11:00'
    },
    {
      id: 'slot-3',
      roomId: 'room-2',
      date: '2024-06-15T00:00:00.000Z',
      startTime: '09:00',
      endTime: '10:00'
    },
    {
      id: 'slot-4',
      roomId: 'room-2',
      date: '2024-06-15T00:00:00.000Z',
      startTime: '10:00',
      endTime: '11:00'
    }
  ]

  const mockRooms = [
    { id: 'room-1', name: 'Room A', order: 0 },
    { id: 'room-2', name: 'Room B', order: 1 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSessionStats', () => {
    it('should return correct session counts', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getSessionStats('edition-1')

      expect(stats.total).toBe(4)
      expect(stats.scheduled).toBe(3) // session-1, session-2, session-4
      expect(stats.unscheduled).toBe(1) // session-3 has no slotId
    })

    it('should count sessions by type', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getSessionStats('edition-1')

      expect(stats.byType.talk).toBe(2)
      expect(stats.byType.workshop).toBe(1)
      expect(stats.byType.keynote).toBe(1)
    })

    it('should handle empty sessions', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getSessionStats('edition-1')

      expect(stats.total).toBe(0)
      expect(stats.scheduled).toBe(0)
      expect(stats.unscheduled).toBe(0)
      expect(stats.byType).toEqual({})
    })
  })

  describe('getRoomOccupancy', () => {
    it('should calculate room occupancy correctly', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const occupancy = await service.getRoomOccupancy('edition-1')

      expect(occupancy).toHaveLength(2)

      const roomA = occupancy.find((r) => r.roomId === 'room-1')
      expect(roomA).toBeDefined()
      expect(roomA?.totalSlots).toBe(2)
      expect(roomA?.occupiedSlots).toBe(2) // slot-1 and slot-2 are occupied
      expect(roomA?.occupancyRate).toBe(100)
      expect(roomA?.emptySlots).toHaveLength(0)

      const roomB = occupancy.find((r) => r.roomId === 'room-2')
      expect(roomB).toBeDefined()
      expect(roomB?.totalSlots).toBe(2)
      expect(roomB?.occupiedSlots).toBe(1) // only slot-3 is occupied
      expect(roomB?.occupancyRate).toBe(50)
      expect(roomB?.emptySlots).toHaveLength(1)
    })

    it('should identify empty slots', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSessions[2]]) // Only session-3 (no slot)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const occupancy = await service.getRoomOccupancy('edition-1')

      const roomA = occupancy.find((r) => r.roomId === 'room-1')
      expect(roomA?.emptySlots).toHaveLength(2)
      expect(roomA?.occupancyRate).toBe(0)
    })

    it('should handle rooms with no slots', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const occupancy = await service.getRoomOccupancy('edition-1')

      expect(occupancy).toHaveLength(2)
      for (const room of occupancy) {
        expect(room.totalSlots).toBe(0)
        expect(room.occupiedSlots).toBe(0)
        expect(room.occupancyRate).toBe(0)
        expect(room.emptySlots).toHaveLength(0)
      }
    })
  })

  describe('getConflictStats', () => {
    it('should return conflict statistics', async () => {
      // For conflict stats, we need to mock the conflict detection service's dependencies
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const conflicts = await service.getConflictStats('edition-1')

      expect(conflicts.total).toBe(0)
      expect(conflicts.blocking).toBe(0)
      expect(conflicts.warnings).toBe(0)
      expect(conflicts.canPublish).toBe(true)
    })
  })

  describe('getStats', () => {
    it('should return comprehensive planning statistics', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getStats('edition-1')

      expect(stats.sessions.total).toBe(4)
      expect(stats.rooms).toHaveLength(2)
      expect(stats.totalRooms).toBe(2)
      expect(stats.totalSlots).toBe(4)
      expect(stats.conflicts.canPublish).toBe(true)
    })

    it('should calculate average occupancy rate', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getStats('edition-1')

      // Room A: 100%, Room B: 50% -> Average: 75%
      expect(stats.averageOccupancyRate).toBe(75)
    })

    it('should count total empty slots', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSessions)
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockSlots)
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockRooms)
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createPlanningStatsService(mockPb)
      const stats = await service.getStats('edition-1')

      // Room A: 0 empty, Room B: 1 empty (slot-4)
      expect(stats.totalEmptySlots).toBe(1)
    })
  })
})
