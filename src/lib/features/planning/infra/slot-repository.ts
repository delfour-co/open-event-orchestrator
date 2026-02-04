import type PocketBase from 'pocketbase'
import type { CreateSlot, Slot, UpdateSlot } from '../domain'
import { slotsOverlap } from '../domain'

export interface SlotRepository {
  findById(id: string): Promise<Slot | null>
  findByEdition(editionId: string): Promise<Slot[]>
  findByRoom(roomId: string): Promise<Slot[]>
  findByDate(editionId: string, date: Date): Promise<Slot[]>
  create(data: CreateSlot): Promise<Slot>
  update(data: UpdateSlot): Promise<Slot>
  delete(id: string): Promise<void>
  checkOverlap(slot: Omit<Slot, 'id'> & { id?: string }): Promise<Slot | null>
}

function mapRecordToSlot(record: Record<string, unknown>): Slot {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    roomId: record.roomId as string,
    date: new Date(record.date as string),
    startTime: record.startTime as string,
    endTime: record.endTime as string,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createSlotRepository(pb: PocketBase): SlotRepository {
  return {
    async findById(id: string): Promise<Slot | null> {
      try {
        const record = await pb.collection('slots').getOne(id)
        return mapRecordToSlot(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<Slot[]> {
      const records = await pb.collection('slots').getFullList({
        filter: `editionId = "${editionId}"`,
        sort: 'date,startTime'
      })
      return records.map(mapRecordToSlot)
    },

    async findByRoom(roomId: string): Promise<Slot[]> {
      const records = await pb.collection('slots').getFullList({
        filter: `roomId = "${roomId}"`,
        sort: 'date,startTime'
      })
      return records.map(mapRecordToSlot)
    },

    async findByDate(editionId: string, date: Date): Promise<Slot[]> {
      const dateStr = date.toISOString().split('T')[0]
      const records = await pb.collection('slots').getFullList({
        filter: `editionId = "${editionId}" && date ~ "${dateStr}"`,
        sort: 'startTime'
      })
      return records.map(mapRecordToSlot)
    },

    async create(data: CreateSlot): Promise<Slot> {
      const record = await pb.collection('slots').create({
        editionId: data.editionId,
        roomId: data.roomId,
        date: data.date.toISOString(),
        startTime: data.startTime,
        endTime: data.endTime
      })
      return mapRecordToSlot(record)
    },

    async update(data: UpdateSlot): Promise<Slot> {
      const updateData: Record<string, unknown> = {}
      if (data.roomId !== undefined) updateData.roomId = data.roomId
      if (data.date !== undefined) updateData.date = data.date.toISOString()
      if (data.startTime !== undefined) updateData.startTime = data.startTime
      if (data.endTime !== undefined) updateData.endTime = data.endTime

      const record = await pb.collection('slots').update(data.id, updateData)
      return mapRecordToSlot(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('slots').delete(id)
    },

    async checkOverlap(slot: Omit<Slot, 'id'> & { id?: string }): Promise<Slot | null> {
      // Find all slots for the same room and date
      const dateStr = slot.date.toISOString().split('T')[0]
      const records = await pb.collection('slots').getFullList({
        filter: `roomId = "${slot.roomId}" && date ~ "${dateStr}"`
      })

      const existingSlots = records.map(mapRecordToSlot)

      // Create a temporary slot object for comparison
      const tempSlot: Slot = {
        id: slot.id || 'temp',
        editionId: slot.editionId,
        roomId: slot.roomId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt
      }

      // Check for overlaps (excluding self if updating)
      for (const existing of existingSlots) {
        if (slot.id && existing.id === slot.id) continue
        if (slotsOverlap(tempSlot, existing)) {
          return existing
        }
      }

      return null
    }
  }
}
