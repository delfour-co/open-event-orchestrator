/**
 * Schedule Conflict Domain
 *
 * Handles detection and management of scheduling conflicts in the event planning.
 */

import { z } from 'zod'

/**
 * Types of scheduling conflicts that can be detected
 */
export const conflictTypeSchema = z.enum([
  'speaker_double_booked', // Same speaker in 2+ overlapping sessions
  'cospeaker_double_booked', // Co-speaker in 2+ overlapping sessions
  'room_double_booked', // Same room has 2+ overlapping sessions
  'track_multiple_rooms' // Same track running in multiple rooms simultaneously
])

export type ConflictType = z.infer<typeof conflictTypeSchema>

/**
 * Severity levels for conflicts
 */
export const conflictSeveritySchema = z.enum([
  'error', // Must be resolved before publishing
  'warning' // Can be published with confirmation
])

export type ConflictSeverity = z.infer<typeof conflictSeveritySchema>

/**
 * A scheduling conflict detected in the schedule
 */
export const scheduleConflictSchema = z.object({
  id: z.string(),
  type: conflictTypeSchema,
  severity: conflictSeveritySchema,
  sessionIds: z.array(z.string()).min(2), // The sessions involved in the conflict
  entityId: z.string(), // The conflicting entity (speakerId, roomId, trackId)
  entityType: z.enum(['speaker', 'room', 'track']),
  message: z.string(),
  date: z.date(),
  timeRange: z.object({
    start: z.string(), // HH:MM format
    end: z.string() // HH:MM format
  }),
  resolved: z.boolean().default(false),
  forcedAt: z.date().optional(), // When the conflict was forced/ignored
  forcedBy: z.string().optional() // Who forced the conflict
})

export type ScheduleConflict = z.infer<typeof scheduleConflictSchema>

/**
 * Session with expanded slot and speaker information for conflict detection
 */
export interface ExpandedSession {
  id: string
  title: string
  slotId: string
  roomId: string
  roomName: string
  trackId?: string
  trackName?: string
  date: Date
  startTime: string
  endTime: string
  speakerIds: string[]
  speakerNames: string[]
}

/**
 * Result of a conflict scan
 */
export interface ConflictScanResult {
  hasConflicts: boolean
  hasBlockingConflicts: boolean // Has errors that prevent publishing
  totalConflicts: number
  conflicts: ScheduleConflict[]
  conflictsByType: Record<ConflictType, ScheduleConflict[]>
  affectedSessions: string[] // Unique session IDs with conflicts
  affectedSpeakers: string[] // Unique speaker IDs with conflicts
}

/**
 * Options for conflict scanning
 */
export interface ConflictScanOptions {
  checkSpeakers?: boolean
  checkRooms?: boolean
  checkTracks?: boolean
  ignoreForced?: boolean // Don't report conflicts that were forced
}

// ============================================================================
// Domain Functions
// ============================================================================

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)

  return s1 < e2 && s2 < e1
}

/**
 * Check if two sessions overlap in time (same date)
 */
export function sessionsOverlap(session1: ExpandedSession, session2: ExpandedSession): boolean {
  // Must be on the same date
  if (session1.date.toDateString() !== session2.date.toDateString()) {
    return false
  }

  return timeRangesOverlap(
    session1.startTime,
    session1.endTime,
    session2.startTime,
    session2.endTime
  )
}

/**
 * Find overlapping time range between two sessions
 */
export function getOverlapTimeRange(
  session1: ExpandedSession,
  session2: ExpandedSession
): { start: string; end: string } | null {
  if (!sessionsOverlap(session1, session2)) {
    return null
  }

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const fromMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const s1 = toMinutes(session1.startTime)
  const e1 = toMinutes(session1.endTime)
  const s2 = toMinutes(session2.startTime)
  const e2 = toMinutes(session2.endTime)

  return {
    start: fromMinutes(Math.max(s1, s2)),
    end: fromMinutes(Math.min(e1, e2))
  }
}

/**
 * Generate a unique conflict ID based on conflict parameters
 */
export function generateConflictId(
  type: ConflictType,
  entityId: string,
  sessionIds: string[]
): string {
  const sortedIds = [...sessionIds].sort().join('_')
  return `${type}_${entityId}_${sortedIds}`
}

/**
 * Detect speaker conflicts (same speaker in overlapping sessions)
 */
export function detectSpeakerConflicts(sessions: ExpandedSession[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const speakerSessions = new Map<string, ExpandedSession[]>()

  // Group sessions by speaker
  for (const session of sessions) {
    for (const speakerId of session.speakerIds) {
      const existing = speakerSessions.get(speakerId) || []
      existing.push(session)
      speakerSessions.set(speakerId, existing)
    }
  }

  // Check for overlapping sessions per speaker
  for (const [speakerId, speakerSessionList] of speakerSessions) {
    for (let i = 0; i < speakerSessionList.length; i++) {
      for (let j = i + 1; j < speakerSessionList.length; j++) {
        const s1 = speakerSessionList[i]
        const s2 = speakerSessionList[j]

        if (sessionsOverlap(s1, s2)) {
          const timeRange = getOverlapTimeRange(s1, s2)
          if (!timeRange) continue

          const speakerName = s1.speakerNames[s1.speakerIds.indexOf(speakerId)] || 'Speaker'
          const isPrimarySpeaker = s1.speakerIds[0] === speakerId || s2.speakerIds[0] === speakerId

          conflicts.push({
            id: generateConflictId(
              isPrimarySpeaker ? 'speaker_double_booked' : 'cospeaker_double_booked',
              speakerId,
              [s1.id, s2.id]
            ),
            type: isPrimarySpeaker ? 'speaker_double_booked' : 'cospeaker_double_booked',
            severity: 'error',
            sessionIds: [s1.id, s2.id],
            entityId: speakerId,
            entityType: 'speaker',
            message: `${speakerName} is scheduled in "${s1.title}" and "${s2.title}" at the same time`,
            date: s1.date,
            timeRange,
            resolved: false
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Detect room conflicts (same room with overlapping sessions)
 */
export function detectRoomConflicts(sessions: ExpandedSession[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const roomSessions = new Map<string, ExpandedSession[]>()

  // Group sessions by room
  for (const session of sessions) {
    const existing = roomSessions.get(session.roomId) || []
    existing.push(session)
    roomSessions.set(session.roomId, existing)
  }

  // Check for overlapping sessions per room
  for (const [roomId, roomSessionList] of roomSessions) {
    for (let i = 0; i < roomSessionList.length; i++) {
      for (let j = i + 1; j < roomSessionList.length; j++) {
        const s1 = roomSessionList[i]
        const s2 = roomSessionList[j]

        if (sessionsOverlap(s1, s2)) {
          const timeRange = getOverlapTimeRange(s1, s2)
          if (!timeRange) continue

          conflicts.push({
            id: generateConflictId('room_double_booked', roomId, [s1.id, s2.id]),
            type: 'room_double_booked',
            severity: 'error',
            sessionIds: [s1.id, s2.id],
            entityId: roomId,
            entityType: 'room',
            message: `${s1.roomName} has overlapping sessions: "${s1.title}" and "${s2.title}"`,
            date: s1.date,
            timeRange,
            resolved: false
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Detect track conflicts (same track in multiple rooms at the same time)
 */
export function detectTrackConflicts(sessions: ExpandedSession[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const trackSessions = new Map<string, ExpandedSession[]>()

  // Group sessions by track (ignore sessions without track)
  for (const session of sessions) {
    if (!session.trackId) continue
    const existing = trackSessions.get(session.trackId) || []
    existing.push(session)
    trackSessions.set(session.trackId, existing)
  }

  // Check for overlapping sessions per track in different rooms
  for (const [trackId, trackSessionList] of trackSessions) {
    for (let i = 0; i < trackSessionList.length; i++) {
      for (let j = i + 1; j < trackSessionList.length; j++) {
        const s1 = trackSessionList[i]
        const s2 = trackSessionList[j]

        // Only a conflict if in different rooms
        if (s1.roomId === s2.roomId) continue

        if (sessionsOverlap(s1, s2)) {
          const timeRange = getOverlapTimeRange(s1, s2)
          if (!timeRange) continue

          conflicts.push({
            id: generateConflictId('track_multiple_rooms', trackId, [s1.id, s2.id]),
            type: 'track_multiple_rooms',
            severity: 'warning',
            sessionIds: [s1.id, s2.id],
            entityId: trackId,
            entityType: 'track',
            message: `Track "${s1.trackName}" is running in ${s1.roomName} and ${s2.roomName} at the same time`,
            date: s1.date,
            timeRange,
            resolved: false
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Perform a full conflict scan on a set of sessions
 */
export function scanForConflicts(
  sessions: ExpandedSession[],
  options: ConflictScanOptions = {}
): ConflictScanResult {
  const {
    checkSpeakers = true,
    checkRooms = true,
    checkTracks = true,
    ignoreForced = false
  } = options

  let allConflicts: ScheduleConflict[] = []

  if (checkSpeakers) {
    allConflicts = [...allConflicts, ...detectSpeakerConflicts(sessions)]
  }

  if (checkRooms) {
    allConflicts = [...allConflicts, ...detectRoomConflicts(sessions)]
  }

  if (checkTracks) {
    allConflicts = [...allConflicts, ...detectTrackConflicts(sessions)]
  }

  // Filter out forced conflicts if requested
  if (ignoreForced) {
    allConflicts = allConflicts.filter((c) => !c.forcedAt)
  }

  // Deduplicate by ID
  const uniqueConflicts = Array.from(new Map(allConflicts.map((c) => [c.id, c])).values())

  // Group by type
  const conflictsByType: Record<ConflictType, ScheduleConflict[]> = {
    speaker_double_booked: [],
    cospeaker_double_booked: [],
    room_double_booked: [],
    track_multiple_rooms: []
  }

  for (const conflict of uniqueConflicts) {
    conflictsByType[conflict.type].push(conflict)
  }

  // Collect affected entities
  const affectedSessions = [...new Set(uniqueConflicts.flatMap((c) => c.sessionIds))]
  const affectedSpeakers = [
    ...new Set(uniqueConflicts.filter((c) => c.entityType === 'speaker').map((c) => c.entityId))
  ]

  const hasBlockingConflicts = uniqueConflicts.some((c) => c.severity === 'error')

  return {
    hasConflicts: uniqueConflicts.length > 0,
    hasBlockingConflicts,
    totalConflicts: uniqueConflicts.length,
    conflicts: uniqueConflicts,
    conflictsByType,
    affectedSessions,
    affectedSpeakers
  }
}

/**
 * Get human-readable label for conflict type
 */
export function getConflictTypeLabel(type: ConflictType): string {
  const labels: Record<ConflictType, string> = {
    speaker_double_booked: 'Speaker Double-Booked',
    cospeaker_double_booked: 'Co-Speaker Double-Booked',
    room_double_booked: 'Room Double-Booked',
    track_multiple_rooms: 'Track in Multiple Rooms'
  }
  return labels[type]
}

/**
 * Get severity configuration for conflict type
 */
export function getConflictSeverity(type: ConflictType): ConflictSeverity {
  const severities: Record<ConflictType, ConflictSeverity> = {
    speaker_double_booked: 'error',
    cospeaker_double_booked: 'error',
    room_double_booked: 'error',
    track_multiple_rooms: 'warning'
  }
  return severities[type]
}

/**
 * Get color for conflict severity (for UI display)
 */
export function getConflictSeverityColor(severity: ConflictSeverity): string {
  return severity === 'error' ? 'red' : 'yellow'
}

/**
 * Check if a schedule can be published (no unresolved blocking conflicts)
 */
export function canPublishSchedule(scanResult: ConflictScanResult): boolean {
  return !scanResult.hasBlockingConflicts
}

/**
 * Format conflict for display
 */
export function formatConflict(conflict: ScheduleConflict): string {
  const dateStr = conflict.date.toLocaleDateString()
  const timeStr = `${conflict.timeRange.start} - ${conflict.timeRange.end}`
  return `[${getConflictTypeLabel(conflict.type)}] ${conflict.message} (${dateStr} ${timeStr})`
}

/**
 * Check if a specific session has conflicts
 */
export function sessionHasConflicts(sessionId: string, scanResult: ConflictScanResult): boolean {
  return scanResult.affectedSessions.includes(sessionId)
}

/**
 * Get conflicts for a specific session
 */
export function getConflictsForSession(
  sessionId: string,
  scanResult: ConflictScanResult
): ScheduleConflict[] {
  return scanResult.conflicts.filter((c) => c.sessionIds.includes(sessionId))
}

/**
 * Check if a specific speaker has conflicts
 */
export function speakerHasConflicts(speakerId: string, scanResult: ConflictScanResult): boolean {
  return scanResult.affectedSpeakers.includes(speakerId)
}

/**
 * Get conflicts for a specific speaker
 */
export function getConflictsForSpeaker(
  speakerId: string,
  scanResult: ConflictScanResult
): ScheduleConflict[] {
  return scanResult.conflicts.filter((c) => c.entityType === 'speaker' && c.entityId === speakerId)
}
