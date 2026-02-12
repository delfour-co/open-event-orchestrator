/**
 * Conflict Detection Service
 *
 * Provides conflict detection for event schedules by fetching sessions,
 * slots, and speaker data from PocketBase and running conflict analysis.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type ConflictScanOptions,
  type ConflictScanResult,
  type ExpandedSession,
  type ScheduleConflict,
  canPublishSchedule,
  getConflictsForSession,
  getConflictsForSpeaker,
  scanForConflicts,
  sessionHasConflicts,
  speakerHasConflicts
} from '../domain/schedule-conflict'

export interface ConflictDetectionService {
  /**
   * Scan an entire edition for scheduling conflicts
   */
  scanEdition(editionId: string, options?: ConflictScanOptions): Promise<ConflictScanResult>

  /**
   * Check if a specific session placement would cause conflicts
   */
  checkSessionPlacement(
    editionId: string,
    sessionId: string,
    slotId: string,
    speakerIds: string[],
    trackId?: string
  ): Promise<ConflictScanResult>

  /**
   * Check if a speaker has any conflicts in the schedule
   */
  getSpeakerConflicts(editionId: string, speakerId: string): Promise<ScheduleConflict[]>

  /**
   * Check if a session has any conflicts
   */
  getSessionConflicts(editionId: string, sessionId: string): Promise<ScheduleConflict[]>

  /**
   * Check if the schedule can be published (no blocking conflicts)
   */
  canPublish(editionId: string): Promise<boolean>

  /**
   * Force a conflict (mark as accepted despite the issue)
   */
  forceConflict(conflictId: string, userId: string): Promise<void>

  /**
   * Get a summary of all conflicts for the edition
   */
  getConflictSummary(editionId: string): Promise<{
    totalConflicts: number
    blockingConflicts: number
    speakerConflicts: number
    roomConflicts: number
    trackConflicts: number
    canPublish: boolean
  }>
}

export const createConflictDetectionService = (pb: PocketBase): ConflictDetectionService => {
  /**
   * Fetch all expanded sessions for an edition
   */
  async function fetchExpandedSessions(editionId: string): Promise<ExpandedSession[]> {
    // Fetch sessions with expanded slot and talk data
    const sessions = await pb.collection('sessions').getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      expand: 'slotId,talkId,trackId'
    })

    // Fetch slots for the edition
    const slots = await pb.collection('slots').getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      expand: 'roomId'
    })

    // Fetch rooms for the edition
    const rooms = await pb.collection('rooms').getFullList({
      filter: safeFilter`editionId = ${editionId}`
    })

    // Fetch tracks for the edition
    const tracks = await pb.collection('tracks').getFullList({
      filter: safeFilter`editionId = ${editionId}`
    })

    // Fetch speakers for the edition
    const speakers = await pb.collection('speakers').getFullList({
      filter: safeFilter`editionId = ${editionId}`
    })

    // Build lookup maps
    const slotMap = new Map(slots.map((s) => [s.id, s]))
    const roomMap = new Map(rooms.map((r) => [r.id, r]))
    const trackMap = new Map(tracks.map((t) => [t.id, t]))
    const speakerMap = new Map(speakers.map((s) => [s.id, s]))

    // Build expanded sessions
    const expandedSessions: ExpandedSession[] = []

    for (const session of sessions) {
      const slot = slotMap.get(session.slotId)
      if (!slot) continue // Skip sessions without valid slots

      const room = roomMap.get(slot.roomId)
      if (!room) continue // Skip sessions without valid rooms

      const track = session.trackId ? trackMap.get(session.trackId) : null

      // Get speaker IDs from the linked talk
      let speakerIds: string[] = []
      let speakerNames: string[] = []

      if (session.talkId) {
        const talk = session.expand?.talkId as Record<string, unknown> | undefined
        if (talk && Array.isArray(talk.speakerIds)) {
          speakerIds = talk.speakerIds as string[]
          speakerNames = speakerIds.map((id) => {
            const speaker = speakerMap.get(id)
            return speaker ? (speaker.name as string) : 'Unknown Speaker'
          })
        }
      }

      expandedSessions.push({
        id: session.id,
        title: session.title,
        slotId: session.slotId,
        roomId: slot.roomId,
        roomName: room.name,
        trackId: session.trackId || undefined,
        trackName: track?.name || undefined,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        speakerIds,
        speakerNames
      })
    }

    return expandedSessions
  }

  return {
    async scanEdition(
      editionId: string,
      options: ConflictScanOptions = {}
    ): Promise<ConflictScanResult> {
      const sessions = await fetchExpandedSessions(editionId)
      return scanForConflicts(sessions, options)
    },

    async checkSessionPlacement(
      editionId: string,
      sessionId: string,
      slotId: string,
      speakerIds: string[],
      trackId?: string
    ): Promise<ConflictScanResult> {
      // Fetch all current sessions
      const sessions = await fetchExpandedSessions(editionId)

      // Fetch the target slot details
      const slot = await pb.collection('slots').getOne(slotId, {
        expand: 'roomId'
      })

      const room = slot.expand?.roomId as Record<string, unknown> | undefined

      // Fetch speaker names
      const speakerNames: string[] = []
      for (const spId of speakerIds) {
        try {
          const speaker = await pb.collection('speakers').getOne(spId)
          speakerNames.push(speaker.name as string)
        } catch {
          speakerNames.push('Unknown Speaker')
        }
      }

      // Fetch track name if provided
      let trackName: string | undefined
      if (trackId) {
        try {
          const track = await pb.collection('tracks').getOne(trackId)
          trackName = track.name as string
        } catch {
          trackName = undefined
        }
      }

      // Create the hypothetical session placement
      const hypotheticalSession: ExpandedSession = {
        id: sessionId,
        title: 'New Session',
        slotId,
        roomId: slot.roomId,
        roomName: room?.name as string,
        trackId,
        trackName,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        speakerIds,
        speakerNames
      }

      // Remove any existing session with the same ID and add the hypothetical one
      const otherSessions = sessions.filter((s) => s.id !== sessionId)
      const allSessions = [...otherSessions, hypotheticalSession]

      // Scan for conflicts
      const result = scanForConflicts(allSessions)

      // Filter to only return conflicts involving the hypothetical session
      const relevantConflicts = result.conflicts.filter((c) => c.sessionIds.includes(sessionId))

      return {
        ...result,
        conflicts: relevantConflicts,
        totalConflicts: relevantConflicts.length,
        hasConflicts: relevantConflicts.length > 0,
        hasBlockingConflicts: relevantConflicts.some((c) => c.severity === 'error')
      }
    },

    async getSpeakerConflicts(editionId: string, speakerId: string): Promise<ScheduleConflict[]> {
      const result = await this.scanEdition(editionId)
      if (!speakerHasConflicts(speakerId, result)) {
        return []
      }
      return getConflictsForSpeaker(speakerId, result)
    },

    async getSessionConflicts(editionId: string, sessionId: string): Promise<ScheduleConflict[]> {
      const result = await this.scanEdition(editionId)
      if (!sessionHasConflicts(sessionId, result)) {
        return []
      }
      return getConflictsForSession(sessionId, result)
    },

    async canPublish(editionId: string): Promise<boolean> {
      const result = await this.scanEdition(editionId)
      return canPublishSchedule(result)
    },

    async forceConflict(conflictId: string, userId: string): Promise<void> {
      // Store forced conflicts in a separate collection
      await pb.collection('forced_conflicts').create({
        conflictId,
        forcedBy: userId,
        forcedAt: new Date().toISOString()
      })
    },

    async getConflictSummary(editionId: string): Promise<{
      totalConflicts: number
      blockingConflicts: number
      speakerConflicts: number
      roomConflicts: number
      trackConflicts: number
      canPublish: boolean
    }> {
      const result = await this.scanEdition(editionId)

      const speakerConflicts =
        result.conflictsByType.speaker_double_booked.length +
        result.conflictsByType.cospeaker_double_booked.length

      return {
        totalConflicts: result.totalConflicts,
        blockingConflicts: result.conflicts.filter((c) => c.severity === 'error').length,
        speakerConflicts,
        roomConflicts: result.conflictsByType.room_double_booked.length,
        trackConflicts: result.conflictsByType.track_multiple_rooms.length,
        canPublish: canPublishSchedule(result)
      }
    }
  }
}

export type {
  ConflictScanResult,
  ScheduleConflict,
  ExpandedSession
} from '../domain/schedule-conflict'
