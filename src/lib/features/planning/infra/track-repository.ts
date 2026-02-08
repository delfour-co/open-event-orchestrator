import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateTrack, Track, UpdateTrack } from '../domain'

export interface TrackRepository {
  findById(id: string): Promise<Track | null>
  findByEdition(editionId: string): Promise<Track[]>
  create(data: CreateTrack): Promise<Track>
  update(data: UpdateTrack): Promise<Track>
  delete(id: string): Promise<void>
}

function mapRecordToTrack(record: Record<string, unknown>): Track {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    color: (record.color as string) || '#6b7280',
    description: record.description as string | undefined,
    order: (record.order as number) || 0,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createTrackRepository(pb: PocketBase): TrackRepository {
  return {
    async findById(id: string): Promise<Track | null> {
      try {
        const record = await pb.collection('tracks').getOne(id)
        return mapRecordToTrack(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<Track[]> {
      const records = await pb.collection('tracks').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'order,name'
      })
      return records.map(mapRecordToTrack)
    },

    async create(data: CreateTrack): Promise<Track> {
      const record = await pb.collection('tracks').create({
        editionId: data.editionId,
        name: data.name,
        color: data.color ?? '#6b7280',
        description: data.description,
        order: data.order ?? 0
      })
      return mapRecordToTrack(record)
    },

    async update(data: UpdateTrack): Promise<Track> {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.color !== undefined) updateData.color = data.color
      if (data.description !== undefined) updateData.description = data.description
      if (data.order !== undefined) updateData.order = data.order

      const record = await pb.collection('tracks').update(data.id, updateData)
      return mapRecordToTrack(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('tracks').delete(id)
    }
  }
}
