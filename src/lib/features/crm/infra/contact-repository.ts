import type PocketBase from 'pocketbase'
import type { Contact, ContactSource, CreateContact } from '../domain'

const COLLECTION = 'contacts'

export interface ContactListOptions {
  search?: string
  source?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export const createContactRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Contact | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToContact(record)
    } catch {
      return null
    }
  },

  async findByEvent(eventId: string, options?: ContactListOptions): Promise<Contact[]> {
    const filters: string[] = [`eventId = "${eventId}"`]

    if (options?.search) {
      const search = options.search.replace(/"/g, '\\"')
      filters.push(
        `(firstName ~ "${search}" || lastName ~ "${search}" || email ~ "${search}" || company ~ "${search}")`
      )
    }

    if (options?.source) {
      filters.push(`source = "${options.source}"`)
    }

    if (options?.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        filters.push(`tags ~ "${tag.replace(/"/g, '\\"')}"`)
      }
    }

    const filter = filters.join(' && ')

    if (options?.limit !== undefined) {
      const page = options.offset ? Math.floor(options.offset / options.limit) + 1 : 1
      const records = await pb.collection(COLLECTION).getList(page, options.limit, {
        filter,
        sort: '-created'
      })
      return records.items.map(mapRecordToContact)
    }

    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: '-created'
    })
    return records.map(mapRecordToContact)
  },

  async findByEmail(email: string, eventId: string): Promise<Contact | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `email = "${email}" && eventId = "${eventId}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToContact(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateContact): Promise<Contact> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      tags: JSON.stringify(data.tags)
    })
    return mapRecordToContact(record)
  },

  async update(id: string, data: Partial<CreateContact>): Promise<Contact> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags)
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToContact(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByEvent(eventId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `eventId = "${eventId}"`,
      fields: 'id'
    })
    return records.totalItems
  },

  async findByIds(ids: string[]): Promise<Contact[]> {
    if (ids.length === 0) return []
    const filter = ids.map((id) => `id = "${id}"`).join(' || ')
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: '-created'
    })
    return records.map(mapRecordToContact)
  }
})

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const mapRecordToContact = (record: Record<string, unknown>): Contact => ({
  id: record.id as string,
  eventId: record.eventId as string,
  email: record.email as string,
  firstName: record.firstName as string,
  lastName: record.lastName as string,
  company: record.company as string | undefined,
  jobTitle: record.jobTitle as string | undefined,
  phone: record.phone as string | undefined,
  address: record.address as string | undefined,
  bio: record.bio as string | undefined,
  photoUrl: record.photoUrl as string | undefined,
  twitter: record.twitter as string | undefined,
  linkedin: record.linkedin as string | undefined,
  github: record.github as string | undefined,
  city: record.city as string | undefined,
  country: record.country as string | undefined,
  source: (record.source as ContactSource) || 'manual',
  tags: parseTags(record.tags),
  notes: record.notes as string | undefined,
  unsubscribeToken: record.unsubscribeToken as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ContactRepository = ReturnType<typeof createContactRepository>
