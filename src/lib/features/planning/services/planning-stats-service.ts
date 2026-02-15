/**
 * Planning Statistics Service
 *
 * Provides statistical data about planning for an edition:
 * - Session counts (scheduled vs total)
 * - Room occupancy rates
 * - Conflict statistics
 * - Empty slots detection
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import { createConflictDetectionService } from './conflict-detection-service'

export interface SessionStats {
  total: number
  scheduled: number
  unscheduled: number
  byType: Record<string, number>
}

export interface RoomOccupancy {
  roomId: string
  roomName: string
  totalSlots: number
  occupiedSlots: number
  occupancyRate: number
  emptySlots: EmptySlot[]
}

export interface EmptySlot {
  slotId: string
  date: string
  startTime: string
  endTime: string
}

export interface ConflictStats {
  total: number
  blocking: number
  warnings: number
  bySpeaker: number
  byRoom: number
  byTrack: number
  canPublish: boolean
}

export interface PlanningStats {
  sessions: SessionStats
  rooms: RoomOccupancy[]
  conflicts: ConflictStats
  totalRooms: number
  totalSlots: number
  totalEmptySlots: number
  averageOccupancyRate: number
}

export interface PlanningStatsService {
  /**
   * Get comprehensive planning statistics for an edition
   */
  getStats(editionId: string): Promise<PlanningStats>

  /**
   * Get session statistics for an edition
   */
  getSessionStats(editionId: string): Promise<SessionStats>

  /**
   * Get room occupancy statistics for an edition
   */
  getRoomOccupancy(editionId: string): Promise<RoomOccupancy[]>

  /**
   * Get conflict statistics for an edition
   */
  getConflictStats(editionId: string): Promise<ConflictStats>
}

export const createPlanningStatsService = (pb: PocketBase): PlanningStatsService => {
  const conflictService = createConflictDetectionService(pb)

  return {
    async getStats(editionId: string): Promise<PlanningStats> {
      const [sessions, rooms, conflicts] = await Promise.all([
        this.getSessionStats(editionId),
        this.getRoomOccupancy(editionId),
        this.getConflictStats(editionId)
      ])

      const totalEmptySlots = rooms.reduce((sum, room) => sum + room.emptySlots.length, 0)
      const totalSlots = rooms.reduce((sum, room) => sum + room.totalSlots, 0)
      const averageOccupancyRate =
        rooms.length > 0
          ? rooms.reduce((sum, room) => sum + room.occupancyRate, 0) / rooms.length
          : 0

      return {
        sessions,
        rooms,
        conflicts,
        totalRooms: rooms.length,
        totalSlots,
        totalEmptySlots,
        averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100
      }
    },

    async getSessionStats(editionId: string): Promise<SessionStats> {
      // Fetch all sessions for the edition
      const sessions = await pb.collection('sessions').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id,slotId,type'
      })

      // Fetch all slots for the edition
      const slots = await pb.collection('slots').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id'
      })

      const slotIds = new Set(slots.map((s) => s.id as string))

      // Count sessions by type
      const byType: Record<string, number> = {}
      let scheduled = 0

      for (const session of sessions) {
        const type = (session.type as string) || 'talk'
        byType[type] = (byType[type] || 0) + 1

        // A session is scheduled if it has a valid slotId
        if (session.slotId && slotIds.has(session.slotId as string)) {
          scheduled++
        }
      }

      return {
        total: sessions.length,
        scheduled,
        unscheduled: sessions.length - scheduled,
        byType
      }
    },

    async getRoomOccupancy(editionId: string): Promise<RoomOccupancy[]> {
      // Fetch all rooms for the edition
      const rooms = await pb.collection('rooms').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'order,name'
      })

      // Fetch all slots for the edition
      const slots = await pb.collection('slots').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'date,startTime'
      })

      // Fetch all sessions for the edition
      const sessions = await pb.collection('sessions').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id,slotId'
      })

      // Build a set of occupied slot IDs
      const occupiedSlotIds = new Set(
        sessions.filter((s) => s.slotId).map((s) => s.slotId as string)
      )

      // Group slots by room
      const slotsByRoom = new Map<string, Array<Record<string, unknown>>>()
      for (const slot of slots) {
        const roomId = slot.roomId as string
        const existing = slotsByRoom.get(roomId) || []
        existing.push(slot)
        slotsByRoom.set(roomId, existing)
      }

      // Calculate occupancy for each room
      const roomOccupancies: RoomOccupancy[] = []

      for (const room of rooms) {
        const roomSlots = slotsByRoom.get(room.id as string) || []
        const totalSlots = roomSlots.length
        const occupiedSlots = roomSlots.filter((s) => occupiedSlotIds.has(s.id as string)).length
        const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0

        // Find empty slots
        const emptySlots: EmptySlot[] = roomSlots
          .filter((s) => !occupiedSlotIds.has(s.id as string))
          .map((s) => ({
            slotId: s.id as string,
            date: formatDate(s.date as string),
            startTime: s.startTime as string,
            endTime: s.endTime as string
          }))

        roomOccupancies.push({
          roomId: room.id as string,
          roomName: room.name as string,
          totalSlots,
          occupiedSlots,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          emptySlots
        })
      }

      return roomOccupancies
    },

    async getConflictStats(editionId: string): Promise<ConflictStats> {
      const summary = await conflictService.getConflictSummary(editionId)

      return {
        total: summary.totalConflicts,
        blocking: summary.blockingConflicts,
        warnings: summary.totalConflicts - summary.blockingConflicts,
        bySpeaker: summary.speakerConflicts,
        byRoom: summary.roomConflicts,
        byTrack: summary.trackConflicts,
        canPublish: summary.canPublish
      }
    }
  }
}

/**
 * Format a date string to YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

export type { PlanningStatsService as PlanningStatsServiceType }
