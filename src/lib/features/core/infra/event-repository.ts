import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { CreateEventInput, Event, UpdateEventInput } from '../domain'

export type EventRepository = {
  create: (input: CreateEventInput) => Promise<Event>
  findById: (id: string) => Promise<Event | null>
  findBySlug: (slug: string) => Promise<Event | null>
  findByOrganization: (organizationId: string) => Promise<Event[]>
  update: (id: string, input: UpdateEventInput) => Promise<Event>
  delete: (id: string) => Promise<void>
}

const mapToEvent = (record: RecordModel): Event => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  slug: record.slug,
  description: record.description || undefined,
  logo: record.logo || undefined,
  website: record.website || undefined,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated)
})

export const createEventRepository = (pb: PocketBase): EventRepository => ({
  async create(input) {
    const record = await pb.collection('events').create(input)
    return mapToEvent(record)
  },

  async findById(id) {
    try {
      const record = await pb.collection('events').getOne(id)
      return mapToEvent(record)
    } catch {
      return null
    }
  },

  async findBySlug(slug) {
    try {
      const record = await pb.collection('events').getFirstListItem(`slug="${slug}"`)
      return mapToEvent(record)
    } catch {
      return null
    }
  },

  async findByOrganization(organizationId) {
    const records = await pb
      .collection('events')
      .getFullList({ filter: `organizationId="${organizationId}"` })
    return records.map(mapToEvent)
  },

  async update(id, input) {
    const record = await pb.collection('events').update(id, input)
    return mapToEvent(record)
  },

  async delete(id) {
    await pb.collection('events').delete(id)
  }
})
