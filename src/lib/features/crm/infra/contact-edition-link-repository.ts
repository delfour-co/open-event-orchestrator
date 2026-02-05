import type PocketBase from 'pocketbase'
import type { ContactEditionLink, CreateContactEditionLink, EditionRole } from '../domain'

const COLLECTION = 'contact_edition_links'

export const createContactEditionLinkRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<ContactEditionLink | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToContactEditionLink(record)
    } catch {
      return null
    }
  },

  async findByContact(contactId: string): Promise<ContactEditionLink[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `contactId = "${contactId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToContactEditionLink)
  },

  async findByEdition(editionId: string): Promise<ContactEditionLink[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToContactEditionLink)
  },

  async findByContactAndEdition(
    contactId: string,
    editionId: string
  ): Promise<ContactEditionLink | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `contactId = "${contactId}" && editionId = "${editionId}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToContactEditionLink(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateContactEditionLink): Promise<ContactEditionLink> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      roles: JSON.stringify(data.roles)
    })
    return mapRecordToContactEditionLink(record)
  },

  async update(id: string, data: Partial<CreateContactEditionLink>): Promise<ContactEditionLink> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.roles !== undefined) {
      updateData.roles = JSON.stringify(data.roles)
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToContactEditionLink(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const parseRoles = (value: unknown): EditionRole[] => {
  if (Array.isArray(value)) return value as EditionRole[]
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

const mapRecordToContactEditionLink = (record: Record<string, unknown>): ContactEditionLink => ({
  id: record.id as string,
  contactId: record.contactId as string,
  editionId: record.editionId as string,
  roles: parseRoles(record.roles),
  speakerId: record.speakerId as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ContactEditionLinkRepository = ReturnType<typeof createContactEditionLinkRepository>
