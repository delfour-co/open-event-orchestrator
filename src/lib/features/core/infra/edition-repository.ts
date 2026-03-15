import type { PBEditionRecord } from '$lib/server/pb-types'
import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateEditionInput, Edition, UpdateEditionInput } from '../domain'

export type EditionRepository = {
  create: (input: CreateEditionInput) => Promise<Edition>
  findById: (id: string) => Promise<Edition | null>
  findBySlug: (slug: string) => Promise<Edition | null>
  findByEvent: (eventId: string) => Promise<Edition[]>
  update: (id: string, input: UpdateEditionInput) => Promise<Edition>
  delete: (id: string) => Promise<void>
}

const mapToEdition = (record: PBEditionRecord): Edition => ({
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
  status: record.status as Edition['status'],
  termsOfSale: record.termsOfSale || undefined,
  codeOfConduct: record.codeOfConduct || undefined,
  privacyPolicy: record.privacyPolicy || undefined,
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
    const record = await pb.collection('editions').create<PBEditionRecord>(data)
    return mapToEdition(record)
  },

  async findById(id) {
    try {
      const record = await pb.collection('editions').getOne<PBEditionRecord>(id)
      return mapToEdition(record)
    } catch {
      return null
    }
  },

  async findBySlug(slug) {
    try {
      const record = await pb
        .collection('editions')
        .getFirstListItem<PBEditionRecord>(safeFilter`slug = ${slug}`)
      return mapToEdition(record)
    } catch {
      return null
    }
  },

  async findByEvent(eventId) {
    const records = await pb
      .collection('editions')
      .getFullList<PBEditionRecord>({ filter: safeFilter`eventId = ${eventId}`, sort: '-year' })
    return records.map(mapToEdition)
  },

  async update(id, input) {
    const data = {
      ...input,
      ...(input.startDate && { startDate: input.startDate.toISOString() }),
      ...(input.endDate && { endDate: input.endDate.toISOString() })
    }
    const record = await pb.collection('editions').update<PBEditionRecord>(id, data)
    return mapToEdition(record)
  },

  async delete(id) {
    await pb.collection('editions').delete(id)
  }
})
