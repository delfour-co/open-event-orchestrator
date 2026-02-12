import { describe, expect, it } from 'vitest'
import {
  type ConflictScanResult,
  type ExpandedSession,
  canPublishSchedule,
  detectRoomConflicts,
  detectSpeakerConflicts,
  detectTrackConflicts,
  formatConflict,
  generateConflictId,
  getConflictSeverity,
  getConflictSeverityColor,
  getConflictTypeLabel,
  getConflictsForSession,
  getConflictsForSpeaker,
  getOverlapTimeRange,
  scanForConflicts,
  sessionHasConflicts,
  sessionsOverlap,
  speakerHasConflicts,
  timeRangesOverlap
} from './schedule-conflict'

describe('schedule-conflict', () => {
  const createSession = (
    id: string,
    overrides: Partial<ExpandedSession> = {}
  ): ExpandedSession => ({
    id,
    title: `Session ${id}`,
    slotId: `slot-${id}`,
    roomId: 'room-1',
    roomName: 'Room A',
    date: new Date('2024-06-15'),
    startTime: '09:00',
    endTime: '10:00',
    speakerIds: ['speaker-1'],
    speakerNames: ['John Doe'],
    ...overrides
  })

  describe('timeRangesOverlap', () => {
    it('should detect overlapping time ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
    })

    it('should detect contained time ranges', () => {
      expect(timeRangesOverlap('09:00', '11:00', '09:30', '10:30')).toBe(true)
    })

    it('should return false for adjacent time ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
    })

    it('should return false for non-overlapping time ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false)
    })

    it('should handle same time ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:00', '10:00')).toBe(true)
    })
  })

  describe('sessionsOverlap', () => {
    it('should detect overlapping sessions on same date', () => {
      const s1 = createSession('1', { startTime: '09:00', endTime: '10:00' })
      const s2 = createSession('2', { startTime: '09:30', endTime: '10:30' })
      expect(sessionsOverlap(s1, s2)).toBe(true)
    })

    it('should return false for sessions on different dates', () => {
      const s1 = createSession('1', { date: new Date('2024-06-15') })
      const s2 = createSession('2', { date: new Date('2024-06-16') })
      expect(sessionsOverlap(s1, s2)).toBe(false)
    })

    it('should return false for non-overlapping sessions on same date', () => {
      const s1 = createSession('1', { startTime: '09:00', endTime: '10:00' })
      const s2 = createSession('2', { startTime: '11:00', endTime: '12:00' })
      expect(sessionsOverlap(s1, s2)).toBe(false)
    })
  })

  describe('getOverlapTimeRange', () => {
    it('should return overlap time range', () => {
      const s1 = createSession('1', { startTime: '09:00', endTime: '10:00' })
      const s2 = createSession('2', { startTime: '09:30', endTime: '10:30' })
      const result = getOverlapTimeRange(s1, s2)
      expect(result).toEqual({ start: '09:30', end: '10:00' })
    })

    it('should return null for non-overlapping sessions', () => {
      const s1 = createSession('1', { startTime: '09:00', endTime: '10:00' })
      const s2 = createSession('2', { startTime: '11:00', endTime: '12:00' })
      const result = getOverlapTimeRange(s1, s2)
      expect(result).toBeNull()
    })

    it('should handle contained sessions', () => {
      const s1 = createSession('1', { startTime: '09:00', endTime: '12:00' })
      const s2 = createSession('2', { startTime: '10:00', endTime: '11:00' })
      const result = getOverlapTimeRange(s1, s2)
      expect(result).toEqual({ start: '10:00', end: '11:00' })
    })
  })

  describe('generateConflictId', () => {
    it('should generate consistent ID', () => {
      const id1 = generateConflictId('speaker_double_booked', 'speaker-1', ['s1', 's2'])
      const id2 = generateConflictId('speaker_double_booked', 'speaker-1', ['s2', 's1'])
      expect(id1).toBe(id2)
    })

    it('should generate different IDs for different types', () => {
      const id1 = generateConflictId('speaker_double_booked', 'speaker-1', ['s1', 's2'])
      const id2 = generateConflictId('room_double_booked', 'speaker-1', ['s1', 's2'])
      expect(id1).not.toBe(id2)
    })
  })

  describe('detectSpeakerConflicts', () => {
    it('should detect speaker double-booking', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1'],
          speakerNames: ['John Doe']
        }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          speakerNames: ['John Doe'],
          roomId: 'room-2',
          roomName: 'Room B'
        })
      ]

      const conflicts = detectSpeakerConflicts(sessions)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('speaker_double_booked')
      expect(conflicts[0].entityId).toBe('speaker-1')
      expect(conflicts[0].severity).toBe('error')
    })

    it('should detect co-speaker double-booking', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-main', 'speaker-co'],
          speakerNames: ['Main Speaker', 'Co Speaker']
        }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-other', 'speaker-co'],
          speakerNames: ['Other Speaker', 'Co Speaker'],
          roomId: 'room-2',
          roomName: 'Room B'
        })
      ]

      const conflicts = detectSpeakerConflicts(sessions)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('cospeaker_double_booked')
    })

    it('should not detect conflicts for non-overlapping sessions', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1']
        }),
        createSession('2', {
          startTime: '11:00',
          endTime: '12:00',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        })
      ]

      const conflicts = detectSpeakerConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })

    it('should not detect conflicts for different speakers', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1']
        }),
        createSession('2', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-2'],
          roomId: 'room-2'
        })
      ]

      const conflicts = detectSpeakerConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })

    it('should detect multiple conflicts for same speaker', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1']
        }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        }),
        createSession('3', {
          startTime: '09:15',
          endTime: '09:45',
          speakerIds: ['speaker-1'],
          roomId: 'room-3'
        })
      ]

      const conflicts = detectSpeakerConflicts(sessions)
      expect(conflicts.length).toBeGreaterThan(1)
    })
  })

  describe('detectRoomConflicts', () => {
    it('should detect room double-booking', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', roomId: 'room-1' }),
        createSession('2', { startTime: '09:30', endTime: '10:30', roomId: 'room-1' })
      ]

      const conflicts = detectRoomConflicts(sessions)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('room_double_booked')
      expect(conflicts[0].entityId).toBe('room-1')
    })

    it('should not detect conflicts for different rooms', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', roomId: 'room-1' }),
        createSession('2', { startTime: '09:00', endTime: '10:00', roomId: 'room-2' })
      ]

      const conflicts = detectRoomConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })

    it('should not detect conflicts for non-overlapping times', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', roomId: 'room-1' }),
        createSession('2', { startTime: '10:00', endTime: '11:00', roomId: 'room-1' })
      ]

      const conflicts = detectRoomConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('detectTrackConflicts', () => {
    it('should detect track in multiple rooms', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'room-1',
          trackId: 'track-1',
          trackName: 'Web Dev'
        }),
        createSession('2', {
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'room-2',
          trackId: 'track-1',
          trackName: 'Web Dev'
        })
      ]

      const conflicts = detectTrackConflicts(sessions)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('track_multiple_rooms')
      expect(conflicts[0].severity).toBe('warning')
    })

    it('should not detect conflicts for same track in same room', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'room-1',
          trackId: 'track-1'
        }),
        createSession('2', {
          startTime: '10:00',
          endTime: '11:00',
          roomId: 'room-1',
          trackId: 'track-1'
        })
      ]

      const conflicts = detectTrackConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })

    it('should ignore sessions without track', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', roomId: 'room-1' }),
        createSession('2', { startTime: '09:00', endTime: '10:00', roomId: 'room-2' })
      ]

      const conflicts = detectTrackConflicts(sessions)
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('scanForConflicts', () => {
    it('should scan all conflict types by default', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1'],
          roomId: 'room-1'
        }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-1'
        })
      ]

      const result = scanForConflicts(sessions)
      expect(result.hasConflicts).toBe(true)
      expect(result.totalConflicts).toBeGreaterThan(0)
    })

    it('should respect scan options', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', speakerIds: ['speaker-1'] }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        })
      ]

      const result = scanForConflicts(sessions, { checkSpeakers: false })
      expect(result.hasConflicts).toBe(false)
    })

    it('should group conflicts by type', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', speakerIds: ['speaker-1'] }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        })
      ]

      const result = scanForConflicts(sessions)
      expect(result.conflictsByType.speaker_double_booked.length).toBeGreaterThan(0)
    })

    it('should track affected sessions', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', speakerIds: ['speaker-1'] }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        }),
        createSession('3', { startTime: '14:00', endTime: '15:00', speakerIds: ['speaker-2'] })
      ]

      const result = scanForConflicts(sessions)
      expect(result.affectedSessions).toContain('1')
      expect(result.affectedSessions).toContain('2')
      expect(result.affectedSessions).not.toContain('3')
    })

    it('should track affected speakers', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', speakerIds: ['speaker-1'] }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        })
      ]

      const result = scanForConflicts(sessions)
      expect(result.affectedSpeakers).toContain('speaker-1')
    })

    it('should identify blocking conflicts', () => {
      const sessions = [
        createSession('1', { startTime: '09:00', endTime: '10:00', speakerIds: ['speaker-1'] }),
        createSession('2', {
          startTime: '09:30',
          endTime: '10:30',
          speakerIds: ['speaker-1'],
          roomId: 'room-2'
        })
      ]

      const result = scanForConflicts(sessions)
      expect(result.hasBlockingConflicts).toBe(true)
    })

    it('should return empty result for no conflicts', () => {
      const sessions = [
        createSession('1', {
          startTime: '09:00',
          endTime: '10:00',
          speakerIds: ['speaker-1'],
          roomId: 'room-1'
        }),
        createSession('2', {
          startTime: '11:00',
          endTime: '12:00',
          speakerIds: ['speaker-2'],
          roomId: 'room-2'
        })
      ]

      const result = scanForConflicts(sessions)
      expect(result.hasConflicts).toBe(false)
      expect(result.totalConflicts).toBe(0)
    })
  })

  describe('getConflictTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getConflictTypeLabel('speaker_double_booked')).toBe('Speaker Double-Booked')
      expect(getConflictTypeLabel('room_double_booked')).toBe('Room Double-Booked')
      expect(getConflictTypeLabel('track_multiple_rooms')).toBe('Track in Multiple Rooms')
    })
  })

  describe('getConflictSeverity', () => {
    it('should return error for speaker conflicts', () => {
      expect(getConflictSeverity('speaker_double_booked')).toBe('error')
      expect(getConflictSeverity('cospeaker_double_booked')).toBe('error')
    })

    it('should return warning for track conflicts', () => {
      expect(getConflictSeverity('track_multiple_rooms')).toBe('warning')
    })
  })

  describe('getConflictSeverityColor', () => {
    it('should return red for errors', () => {
      expect(getConflictSeverityColor('error')).toBe('red')
    })

    it('should return yellow for warnings', () => {
      expect(getConflictSeverityColor('warning')).toBe('yellow')
    })
  })

  describe('canPublishSchedule', () => {
    it('should return true when no blocking conflicts', () => {
      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: false,
        totalConflicts: 1,
        conflicts: [],
        conflictsByType: {
          speaker_double_booked: [],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: [],
        affectedSpeakers: []
      }
      expect(canPublishSchedule(result)).toBe(true)
    })

    it('should return false when there are blocking conflicts', () => {
      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [],
        conflictsByType: {
          speaker_double_booked: [],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: [],
        affectedSpeakers: []
      }
      expect(canPublishSchedule(result)).toBe(false)
    })
  })

  describe('formatConflict', () => {
    it('should format conflict for display', () => {
      const conflict = {
        id: 'test',
        type: 'speaker_double_booked' as const,
        severity: 'error' as const,
        sessionIds: ['s1', 's2'],
        entityId: 'speaker-1',
        entityType: 'speaker' as const,
        message: 'John Doe is double-booked',
        date: new Date('2024-06-15'),
        timeRange: { start: '09:30', end: '10:00' },
        resolved: false
      }

      const formatted = formatConflict(conflict)
      expect(formatted).toContain('Speaker Double-Booked')
      expect(formatted).toContain('John Doe is double-booked')
      expect(formatted).toContain('09:30 - 10:00')
    })
  })

  describe('sessionHasConflicts', () => {
    it('should return true for session with conflicts', () => {
      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [],
        conflictsByType: {
          speaker_double_booked: [],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: ['session-1', 'session-2'],
        affectedSpeakers: []
      }
      expect(sessionHasConflicts('session-1', result)).toBe(true)
    })

    it('should return false for session without conflicts', () => {
      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [],
        conflictsByType: {
          speaker_double_booked: [],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: ['session-1'],
        affectedSpeakers: []
      }
      expect(sessionHasConflicts('session-3', result)).toBe(false)
    })
  })

  describe('getConflictsForSession', () => {
    it('should return conflicts for specific session', () => {
      const conflict = {
        id: 'test',
        type: 'speaker_double_booked' as const,
        severity: 'error' as const,
        sessionIds: ['s1', 's2'],
        entityId: 'speaker-1',
        entityType: 'speaker' as const,
        message: 'Test',
        date: new Date(),
        timeRange: { start: '09:00', end: '10:00' },
        resolved: false
      }

      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [conflict],
        conflictsByType: {
          speaker_double_booked: [conflict],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: ['s1', 's2'],
        affectedSpeakers: []
      }

      expect(getConflictsForSession('s1', result)).toHaveLength(1)
      expect(getConflictsForSession('s3', result)).toHaveLength(0)
    })
  })

  describe('speakerHasConflicts', () => {
    it('should return true for speaker with conflicts', () => {
      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [],
        conflictsByType: {
          speaker_double_booked: [],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: [],
        affectedSpeakers: ['speaker-1']
      }
      expect(speakerHasConflicts('speaker-1', result)).toBe(true)
    })
  })

  describe('getConflictsForSpeaker', () => {
    it('should return conflicts for specific speaker', () => {
      const conflict = {
        id: 'test',
        type: 'speaker_double_booked' as const,
        severity: 'error' as const,
        sessionIds: ['s1', 's2'],
        entityId: 'speaker-1',
        entityType: 'speaker' as const,
        message: 'Test',
        date: new Date(),
        timeRange: { start: '09:00', end: '10:00' },
        resolved: false
      }

      const result: ConflictScanResult = {
        hasConflicts: true,
        hasBlockingConflicts: true,
        totalConflicts: 1,
        conflicts: [conflict],
        conflictsByType: {
          speaker_double_booked: [conflict],
          cospeaker_double_booked: [],
          room_double_booked: [],
          track_multiple_rooms: []
        },
        affectedSessions: [],
        affectedSpeakers: ['speaker-1']
      }

      expect(getConflictsForSpeaker('speaker-1', result)).toHaveLength(1)
      expect(getConflictsForSpeaker('speaker-2', result)).toHaveLength(0)
    })
  })
})
