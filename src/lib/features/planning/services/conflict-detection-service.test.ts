import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createConflictDetectionService } from './conflict-detection-service'

describe('conflict-detection-service', () => {
  let mockPb: PocketBase

  const mockSession1 = {
    id: 'session-1',
    editionId: 'edition-1',
    slotId: 'slot-1',
    talkId: 'talk-1',
    trackId: 'track-1',
    title: 'Session 1',
    expand: {
      talkId: { speakerIds: ['speaker-1'] }
    }
  }

  const mockSession2 = {
    id: 'session-2',
    editionId: 'edition-1',
    slotId: 'slot-2',
    talkId: 'talk-2',
    trackId: 'track-1',
    title: 'Session 2',
    expand: {
      talkId: { speakerIds: ['speaker-1'] }
    }
  }

  const mockSlot1 = {
    id: 'slot-1',
    editionId: 'edition-1',
    roomId: 'room-1',
    date: '2024-06-15',
    startTime: '09:00',
    endTime: '10:00'
  }

  const mockSlot2 = {
    id: 'slot-2',
    editionId: 'edition-1',
    roomId: 'room-2',
    date: '2024-06-15',
    startTime: '09:30',
    endTime: '10:30'
  }

  const mockSlot3 = {
    id: 'slot-3',
    editionId: 'edition-1',
    roomId: 'room-1',
    date: '2024-06-15',
    startTime: '11:00',
    endTime: '12:00'
  }

  const mockRoom1 = {
    id: 'room-1',
    editionId: 'edition-1',
    name: 'Room A'
  }

  const mockRoom2 = {
    id: 'room-2',
    editionId: 'edition-1',
    name: 'Room B'
  }

  const mockTrack1 = {
    id: 'track-1',
    editionId: 'edition-1',
    name: 'Web Dev'
  }

  const mockSpeaker1 = {
    id: 'speaker-1',
    editionId: 'edition-1',
    name: 'John Doe'
  }

  const mockSpeaker2 = {
    id: 'speaker-2',
    editionId: 'edition-1',
    name: 'Jane Smith'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scanEdition', () => {
    it('should detect speaker conflicts', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const result = await service.scanEdition('edition-1')

      expect(result.hasConflicts).toBe(true)
      expect(result.affectedSpeakers).toContain('speaker-1')
    })

    it('should return no conflicts for non-overlapping sessions', async () => {
      const nonOverlappingSession2 = {
        ...mockSession2,
        slotId: 'slot-3'
      }

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, nonOverlappingSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot3])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const result = await service.scanEdition('edition-1')

      expect(result.hasConflicts).toBe(false)
    })

    it('should respect scan options', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const result = await service.scanEdition('edition-1', { checkSpeakers: false })

      // Without speaker checks, should only find track conflicts (if any)
      expect(result.conflictsByType.speaker_double_booked).toHaveLength(0)
    })
  })

  describe('checkSessionPlacement', () => {
    it('should detect conflicts for new session placement', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2]),
              getOne: vi.fn().mockResolvedValue({
                ...mockSlot2,
                expand: { roomId: mockRoom2 }
              })
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1]),
              getOne: vi.fn().mockResolvedValue(mockTrack1)
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1]),
              getOne: vi.fn().mockResolvedValue(mockSpeaker1)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const result = await service.checkSessionPlacement(
        'edition-1',
        'new-session',
        'slot-2',
        ['speaker-1'],
        'track-1'
      )

      expect(result.hasConflicts).toBe(true)
    })
  })

  describe('getSpeakerConflicts', () => {
    it('should return conflicts for a specific speaker', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const conflicts = await service.getSpeakerConflicts('edition-1', 'speaker-1')

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].entityId).toBe('speaker-1')
    })

    it('should return empty array for speaker without conflicts', async () => {
      const nonConflictingSession2 = {
        ...mockSession2,
        expand: {
          talkId: { speakerIds: ['speaker-2'] }
        }
      }

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, nonConflictingSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1, mockSpeaker2])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const conflicts = await service.getSpeakerConflicts('edition-1', 'speaker-1')

      expect(conflicts).toHaveLength(0)
    })
  })

  describe('getSessionConflicts', () => {
    it('should return conflicts for a specific session', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const conflicts = await service.getSessionConflicts('edition-1', 'session-1')

      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0].sessionIds).toContain('session-1')
    })
  })

  describe('canPublish', () => {
    it('should return false when there are blocking conflicts', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const canPublish = await service.canPublish('edition-1')

      expect(canPublish).toBe(false)
    })

    it('should return true when there are no blocking conflicts', async () => {
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

      const service = createConflictDetectionService(mockPb)
      const canPublish = await service.canPublish('edition-1')

      expect(canPublish).toBe(true)
    })
  })

  describe('forceConflict', () => {
    it('should create a forced conflict record', async () => {
      const mockCreate = vi.fn().mockResolvedValue({})

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'forced_conflicts') {
            return { create: mockCreate }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      await service.forceConflict('conflict-123', 'user-1')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictId: 'conflict-123',
          forcedBy: 'user-1'
        })
      )
    })
  })

  describe('getConflictSummary', () => {
    it('should return conflict summary', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'sessions') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSession1, mockSession2])
            }
          }
          if (name === 'slots') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSlot1, mockSlot2])
            }
          }
          if (name === 'rooms') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockRoom1, mockRoom2])
            }
          }
          if (name === 'tracks') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockTrack1])
            }
          }
          if (name === 'speakers') {
            return {
              getFullList: vi.fn().mockResolvedValue([mockSpeaker1])
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createConflictDetectionService(mockPb)
      const summary = await service.getConflictSummary('edition-1')

      expect(summary.totalConflicts).toBeGreaterThan(0)
      expect(summary.speakerConflicts).toBeGreaterThan(0)
      expect(summary.canPublish).toBe(false)
    })
  })
})
