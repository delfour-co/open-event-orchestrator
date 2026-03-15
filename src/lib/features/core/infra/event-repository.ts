import type { PBEventRecord } from '$lib/server/pb-types'
import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateEventInput, Event, UpdateEventInput } from '../domain'

export type EventRepository = {
  create: (input: CreateEventInput) => Promise<Event>
  findById: (id: string) => Promise<Event | null>
  findBySlug: (slug: string) => Promise<Event | null>
  findByOrganization: (organizationId: string) => Promise<Event[]>
  update: (id: string, input: UpdateEventInput) => Promise<Event>
  delete: (id: string) => Promise<void>
}

const mapToEvent = (record: PBEventRecord): Event => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  slug: record.slug,
  description: record.description || undefined,
  logo: record.logo || undefined,
  website: record.website || undefined,
  currency: (record.currency as Event['currency']) || 'USD',
  banner: record.banner || undefined,
  primaryColor: record.primaryColor || undefined,
  secondaryColor: record.secondaryColor || undefined,
  twitter: record.twitter || undefined,
  linkedin: record.linkedin || undefined,
  hashtag: record.hashtag || undefined,
  contactEmail: record.contactEmail || undefined,
  codeOfConductUrl: record.codeOfConductUrl || undefined,
  privacyPolicyUrl: record.privacyPolicyUrl || undefined,
  timezone: record.timezone || undefined,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated)
})

export const createEventRepository = (pb: PocketBase): EventRepository => ({
  async create(input) {
    const record = await pb.collection('events').create<PBEventRecord>(input)
    return mapToEvent(record)
  },

  async findById(id) {
    try {
      const record = await pb.collection('events').getOne<PBEventRecord>(id)
      return mapToEvent(record)
    } catch {
      return null
    }
  },

  async findBySlug(slug) {
    try {
      const record = await pb
        .collection('events')
        .getFirstListItem<PBEventRecord>(safeFilter`slug = ${slug}`)
      return mapToEvent(record)
    } catch {
      return null
    }
  },

  async findByOrganization(organizationId) {
    const records = await pb
      .collection('events')
      .getFullList<PBEventRecord>({ filter: safeFilter`organizationId = ${organizationId}` })
    return records.map(mapToEvent)
  },

  async update(id, input) {
    const record = await pb.collection('events').update<PBEventRecord>(id, input)
    return mapToEvent(record)
  },

  async delete(id) {
    await pb.collection('events').delete(id)
  }
})
