import type PocketBase from 'pocketbase'
import type { BounceType, CreateEmailEvent, EmailEvent, EmailEventType } from '../domain'

export interface EmailEventRepository {
  create(data: CreateEmailEvent): Promise<EmailEvent>
  findById(id: string): Promise<EmailEvent | null>
  findByCampaign(campaignId: string): Promise<EmailEvent[]>
  findByContact(contactId: string): Promise<EmailEvent[]>
  findByCampaignAndContact(campaignId: string, contactId: string): Promise<EmailEvent[]>
  findByCampaignAndType(campaignId: string, type: EmailEventType): Promise<EmailEvent[]>
  countByCampaign(campaignId: string): Promise<number>
  countByCampaignAndType(campaignId: string, type: EmailEventType): Promise<number>
  hasOpenedCampaign(campaignId: string, contactId: string): Promise<boolean>
  hasClickedCampaign(campaignId: string, contactId: string): Promise<boolean>
  delete(id: string): Promise<void>
  deleteByCampaign(campaignId: string): Promise<void>
}

function mapRecordToEmailEvent(record: Record<string, unknown>): EmailEvent {
  return {
    id: record.id as string,
    campaignId: record.campaignId as string,
    contactId: record.contactId as string,
    type: record.type as EmailEventType,
    url: record.url as string | undefined,
    linkId: record.linkId as string | undefined,
    bounceType: record.bounceType as BounceType | undefined,
    bounceReason: record.bounceReason as string | undefined,
    ipAddress: record.ipAddress as string | undefined,
    userAgent: record.userAgent as string | undefined,
    timestamp: new Date(record.timestamp as string),
    createdAt: new Date(record.created as string)
  }
}

export function createEmailEventRepository(pb: PocketBase): EmailEventRepository {
  const collection = 'email_events'

  return {
    async create(data: CreateEmailEvent): Promise<EmailEvent> {
      const record = await pb.collection(collection).create({
        campaignId: data.campaignId,
        contactId: data.contactId,
        type: data.type,
        url: data.url || null,
        linkId: data.linkId || null,
        bounceType: data.bounceType || null,
        bounceReason: data.bounceReason || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        timestamp: data.timestamp?.toISOString() || new Date().toISOString()
      })
      return mapRecordToEmailEvent(record)
    },

    async findById(id: string): Promise<EmailEvent | null> {
      try {
        const record = await pb.collection(collection).getOne(id)
        return mapRecordToEmailEvent(record)
      } catch {
        return null
      }
    },

    async findByCampaign(campaignId: string): Promise<EmailEvent[]> {
      const records = await pb.collection(collection).getFullList({
        filter: `campaignId = "${campaignId}"`,
        sort: '-timestamp'
      })
      return records.map(mapRecordToEmailEvent)
    },

    async findByContact(contactId: string): Promise<EmailEvent[]> {
      const records = await pb.collection(collection).getFullList({
        filter: `contactId = "${contactId}"`,
        sort: '-timestamp'
      })
      return records.map(mapRecordToEmailEvent)
    },

    async findByCampaignAndContact(campaignId: string, contactId: string): Promise<EmailEvent[]> {
      const records = await pb.collection(collection).getFullList({
        filter: `campaignId = "${campaignId}" && contactId = "${contactId}"`,
        sort: '-timestamp'
      })
      return records.map(mapRecordToEmailEvent)
    },

    async findByCampaignAndType(campaignId: string, type: EmailEventType): Promise<EmailEvent[]> {
      const records = await pb.collection(collection).getFullList({
        filter: `campaignId = "${campaignId}" && type = "${type}"`,
        sort: '-timestamp'
      })
      return records.map(mapRecordToEmailEvent)
    },

    async countByCampaign(campaignId: string): Promise<number> {
      const result = await pb.collection(collection).getList(1, 1, {
        filter: `campaignId = "${campaignId}"`
      })
      return result.totalItems
    },

    async countByCampaignAndType(campaignId: string, type: EmailEventType): Promise<number> {
      const result = await pb.collection(collection).getList(1, 1, {
        filter: `campaignId = "${campaignId}" && type = "${type}"`
      })
      return result.totalItems
    },

    async hasOpenedCampaign(campaignId: string, contactId: string): Promise<boolean> {
      const result = await pb.collection(collection).getList(1, 1, {
        filter: `campaignId = "${campaignId}" && contactId = "${contactId}" && type = "opened"`
      })
      return result.totalItems > 0
    },

    async hasClickedCampaign(campaignId: string, contactId: string): Promise<boolean> {
      const result = await pb.collection(collection).getList(1, 1, {
        filter: `campaignId = "${campaignId}" && contactId = "${contactId}" && type = "clicked"`
      })
      return result.totalItems > 0
    },

    async delete(id: string): Promise<void> {
      await pb.collection(collection).delete(id)
    },

    async deleteByCampaign(campaignId: string): Promise<void> {
      const records = await pb.collection(collection).getFullList({
        filter: `campaignId = "${campaignId}"`
      })
      await Promise.all(records.map((r) => pb.collection(collection).delete(r.id)))
    }
  }
}
