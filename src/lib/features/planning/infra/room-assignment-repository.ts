import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateRoomAssignment, RoomAssignment } from '../domain'

export interface UpdateRoomAssignment {
  id: string
  memberId?: string
  date?: Date
  startTime?: string
  endTime?: string
  notes?: string
}

export interface RoomAssignmentRepository {
  findById(id: string): Promise<RoomAssignment | null>
  findByEdition(editionId: string): Promise<RoomAssignment[]>
  findByRoom(roomId: string): Promise<RoomAssignment[]>
  findByMember(memberId: string): Promise<RoomAssignment[]>
  create(data: CreateRoomAssignment): Promise<RoomAssignment>
  update(data: UpdateRoomAssignment): Promise<RoomAssignment>
  delete(id: string): Promise<void>
}

function mapRecordToRoomAssignment(record: Record<string, unknown>): RoomAssignment {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    roomId: record.roomId as string,
    memberId: record.memberId as string,
    date: record.date ? new Date(record.date as string) : undefined,
    startTime: record.startTime as string | undefined,
    endTime: record.endTime as string | undefined,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createRoomAssignmentRepository(pb: PocketBase): RoomAssignmentRepository {
  return {
    async findById(id: string): Promise<RoomAssignment | null> {
      try {
        const record = await pb.collection('room_assignments').getOne(id)
        return mapRecordToRoomAssignment(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<RoomAssignment[]> {
      const records = await pb.collection('room_assignments').getFullList({
        filter: safeFilter`editionId = ${editionId}`
      })
      return records.map(mapRecordToRoomAssignment)
    },

    async findByRoom(roomId: string): Promise<RoomAssignment[]> {
      const records = await pb.collection('room_assignments').getFullList({
        filter: safeFilter`roomId = ${roomId}`
      })
      return records.map(mapRecordToRoomAssignment)
    },

    async findByMember(memberId: string): Promise<RoomAssignment[]> {
      const records = await pb.collection('room_assignments').getFullList({
        filter: safeFilter`memberId = ${memberId}`
      })
      return records.map(mapRecordToRoomAssignment)
    },

    async create(data: CreateRoomAssignment): Promise<RoomAssignment> {
      const record = await pb.collection('room_assignments').create({
        editionId: data.editionId,
        roomId: data.roomId,
        memberId: data.memberId,
        date: data.date?.toISOString() || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        notes: data.notes || null
      })
      return mapRecordToRoomAssignment(record)
    },

    async update(data: UpdateRoomAssignment): Promise<RoomAssignment> {
      const updateData: Record<string, unknown> = {}
      if (data.memberId !== undefined) updateData.memberId = data.memberId
      if (data.date !== undefined) updateData.date = data.date?.toISOString() || null
      if (data.startTime !== undefined) updateData.startTime = data.startTime || null
      if (data.endTime !== undefined) updateData.endTime = data.endTime || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const record = await pb.collection('room_assignments').update(data.id, updateData)
      return mapRecordToRoomAssignment(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('room_assignments').delete(id)
    }
  }
}
