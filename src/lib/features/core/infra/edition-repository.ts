import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { CreateEditionInput, Edition, UpdateEditionInput } from '../domain'

export type EditionRepository = {
  create: (input: CreateEditionInput) => Promise<Edition>
  findById: (id: string) => Promise<Edition | null>
  findBySlug: (slug: string) => Promise<Edition | null>
  findByEvent: (eventId: string) => Promise<Edition[]>
  update: (id: string, input: UpdateEditionInput) => Promise<Edition>
  delete: (id: string) => Promise<void>
}

const mapToEdition = (record: RecordModel): Edition => ({
  id: record.id,
  eventId: record.eventId,
  name: record.name,
  slug: record.slug,
  year: record.year,
  startDate: new Date(record.startDate),
  endDate: new Date(record.endDate),
  venue: record.venue || undefined,
  city: record.city || undefined,
  country: record.country || undefined,
  status: record.status,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated)
})

export const createEditionRepository = (pb: PocketBase): EditionRepository => ({
  async create(input) {
    const data = {
      ...input,
      status: input.status || 'draft',
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString()
    }
    const record = await pb.collection('editions').create(data)
    return mapToEdition(record)
  },

  async findById(id) {
    try {
      const record = await pb.collection('editions').getOne(id)
      return mapToEdition(record)
    } catch {
      return null
    }
  },

  async findBySlug(slug) {
    try {
      const record = await pb.collection('editions').getFirstListItem(safeFilter`slug = ${slug}`)
      return mapToEdition(record)
    } catch {
      return null
    }
  },

  async findByEvent(eventId) {
    const records = await pb
      .collection('editions')
      .getFullList({ filter: safeFilter`eventId = ${eventId}`, sort: '-year' })
    return records.map(mapToEdition)
  },

  async update(id, input) {
    const data = {
      ...input,
      ...(input.startDate && { startDate: input.startDate.toISOString() }),
      ...(input.endDate && { endDate: input.endDate.toISOString() })
    }
    const record = await pb.collection('editions').update(id, data)
    return mapToEdition(record)
  },

  async delete(id) {
    await pb.collection('editions').delete(id)
  }
})
