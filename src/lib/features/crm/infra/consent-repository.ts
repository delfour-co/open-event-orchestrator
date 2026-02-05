import type PocketBase from 'pocketbase'
import type { Consent, ConsentSource, ConsentStatus, ConsentType, CreateConsent } from '../domain'

const COLLECTION = 'consents'

export const createConsentRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Consent | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToConsent(record)
    } catch {
      return null
    }
  },

  async findByContact(contactId: string): Promise<Consent[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `contactId = "${contactId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToConsent)
  },

  async findByContactAndType(contactId: string, type: ConsentType): Promise<Consent | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `contactId = "${contactId}" && type = "${type}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToConsent(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateConsent): Promise<Consent> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      grantedAt: data.grantedAt?.toISOString() || null,
      withdrawnAt: data.withdrawnAt?.toISOString() || null
    })
    return mapRecordToConsent(record)
  },

  async update(id: string, data: Partial<CreateConsent>): Promise<Consent> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.grantedAt !== undefined) {
      updateData.grantedAt = data.grantedAt?.toISOString() || null
    }
    if (data.withdrawnAt !== undefined) {
      updateData.withdrawnAt = data.withdrawnAt?.toISOString() || null
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToConsent(record)
  },

  async grantConsent(
    contactId: string,
    type: ConsentType,
    source: ConsentSource,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Consent> {
    const existing = await this.findByContactAndType(contactId, type)
    const now = new Date()

    if (existing) {
      const record = await pb.collection(COLLECTION).update(existing.id, {
        status: 'granted',
        grantedAt: now.toISOString(),
        withdrawnAt: null,
        source,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      })
      return mapRecordToConsent(record)
    }

    const record = await pb.collection(COLLECTION).create({
      contactId,
      type,
      status: 'granted',
      grantedAt: now.toISOString(),
      source,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null
    })
    return mapRecordToConsent(record)
  },

  async withdrawConsent(contactId: string, type: ConsentType): Promise<Consent | null> {
    const existing = await this.findByContactAndType(contactId, type)
    if (!existing) return null

    const record = await pb.collection(COLLECTION).update(existing.id, {
      status: 'withdrawn',
      withdrawnAt: new Date().toISOString()
    })
    return mapRecordToConsent(record)
  },

  async deleteByContact(contactId: string): Promise<void> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `contactId = "${contactId}"`,
      fields: 'id'
    })
    for (const record of records) {
      await pb.collection(COLLECTION).delete(record.id as string)
    }
  }
})

const mapRecordToConsent = (record: Record<string, unknown>): Consent => ({
  id: record.id as string,
  contactId: record.contactId as string,
  type: record.type as ConsentType,
  status: (record.status as ConsentStatus) || 'denied',
  grantedAt: record.grantedAt ? new Date(record.grantedAt as string) : undefined,
  withdrawnAt: record.withdrawnAt ? new Date(record.withdrawnAt as string) : undefined,
  source: (record.source as ConsentSource) || 'manual',
  ipAddress: record.ipAddress as string | undefined,
  userAgent: record.userAgent as string | undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ConsentRepository = ReturnType<typeof createConsentRepository>
