import type PocketBase from 'pocketbase'
import type { CreateFormat, Format, UpdateFormat } from '../domain'

const COLLECTION = 'formats'

export const createFormatRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Format | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToFormat(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<Format[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order'
    })
    return records.map(mapRecordToFormat)
  },

  async create(data: CreateFormat): Promise<Format> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      order: data.order ?? 0
    })
    return mapRecordToFormat(record)
  },

  async update(id: string, data: UpdateFormat): Promise<Format> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToFormat(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToFormat = (record: Record<string, unknown>): Format => ({
  id: record.id as string,
  editionId: record.editionId as string,
  name: record.name as string,
  description: record.description as string | undefined,
  duration: record.duration as number,
  order: record.order as number,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type FormatRepository = ReturnType<typeof createFormatRepository>
