import type PocketBase from 'pocketbase'
import type { CreateRoom, Room, UpdateRoom } from '../domain'

export interface RoomRepository {
  findById(id: string): Promise<Room | null>
  findByEdition(editionId: string): Promise<Room[]>
  create(data: CreateRoom): Promise<Room>
  update(data: UpdateRoom): Promise<Room>
  delete(id: string): Promise<void>
}

function mapRecordToRoom(record: Record<string, unknown>): Room {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    capacity: record.capacity as number | undefined,
    floor: record.floor as string | undefined,
    description: record.description as string | undefined,
    equipment: (record.equipment as string[]) || [],
    equipmentNotes: record.equipmentNotes as string | undefined,
    order: (record.order as number) || 0,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createRoomRepository(pb: PocketBase): RoomRepository {
  return {
    async findById(id: string): Promise<Room | null> {
      try {
        const record = await pb.collection('rooms').getOne(id)
        return mapRecordToRoom(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<Room[]> {
      const records = await pb.collection('rooms').getFullList({
        filter: `editionId = "${editionId}"`,
        sort: 'order,name'
      })
      return records.map(mapRecordToRoom)
    },

    async create(data: CreateRoom): Promise<Room> {
      const record = await pb.collection('rooms').create({
        editionId: data.editionId,
        name: data.name,
        capacity: data.capacity,
        floor: data.floor,
        description: data.description,
        equipment: data.equipment ?? [],
        equipmentNotes: data.equipmentNotes,
        order: data.order ?? 0
      })
      return mapRecordToRoom(record)
    },

    async update(data: UpdateRoom): Promise<Room> {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.capacity !== undefined) updateData.capacity = data.capacity
      if (data.floor !== undefined) updateData.floor = data.floor
      if (data.description !== undefined) updateData.description = data.description
      if (data.equipment !== undefined) updateData.equipment = data.equipment
      if (data.equipmentNotes !== undefined) updateData.equipmentNotes = data.equipmentNotes
      if (data.order !== undefined) updateData.order = data.order

      const record = await pb.collection('rooms').update(data.id, updateData)
      return mapRecordToRoom(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('rooms').delete(id)
    }
  }
}
