import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Category, CreateCategory, UpdateCategory } from '../domain'

const COLLECTION = 'categories'

export const createCategoryRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Category | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToCategory(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<Category[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: 'order'
    })
    return records.map(mapRecordToCategory)
  },

  async create(data: CreateCategory): Promise<Category> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      order: data.order ?? 0
    })
    return mapRecordToCategory(record)
  },

  async update(id: string, data: UpdateCategory): Promise<Category> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToCategory(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToCategory = (record: Record<string, unknown>): Category => ({
  id: record.id as string,
  editionId: record.editionId as string,
  name: record.name as string,
  description: record.description as string | undefined,
  color: record.color as string | undefined,
  order: record.order as number,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type CategoryRepository = ReturnType<typeof createCategoryRepository>
