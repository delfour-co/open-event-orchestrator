import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CampaignStatus, CreateEmailCampaign, EmailCampaign } from '../domain'

const COLLECTION = 'email_campaigns'

export interface CampaignStatusUpdate {
  sentAt?: Date
  totalRecipients?: number
  totalSent?: number
  totalFailed?: number
}

export const createEmailCampaignRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<EmailCampaign | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToEmailCampaign(record)
    } catch {
      return null
    }
  },

  async findByEvent(eventId: string): Promise<EmailCampaign[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`eventId = ${eventId}`,
      sort: '-created'
    })
    return records.map(mapRecordToEmailCampaign)
  },

  async create(data: CreateEmailCampaign): Promise<EmailCampaign> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      scheduledAt: data.scheduledAt?.toISOString() || null,
      sentAt: data.sentAt?.toISOString() || null,
      totalRecipients: 0,
      totalSent: 0,
      totalFailed: 0
    })
    return mapRecordToEmailCampaign(record)
  },

  async update(id: string, data: Partial<CreateEmailCampaign>): Promise<EmailCampaign> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt?.toISOString() || null
    }
    if (data.sentAt !== undefined) {
      updateData.sentAt = data.sentAt?.toISOString() || null
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToEmailCampaign(record)
  },

  async updateStatus(
    id: string,
    status: CampaignStatus,
    extra?: CampaignStatusUpdate
  ): Promise<EmailCampaign> {
    const updateData: Record<string, unknown> = { status }
    if (extra?.sentAt) {
      updateData.sentAt = extra.sentAt.toISOString()
    }
    if (extra?.totalRecipients !== undefined) {
      updateData.totalRecipients = extra.totalRecipients
    }
    if (extra?.totalSent !== undefined) {
      updateData.totalSent = extra.totalSent
    }
    if (extra?.totalFailed !== undefined) {
      updateData.totalFailed = extra.totalFailed
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToEmailCampaign(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToEmailCampaign = (record: Record<string, unknown>): EmailCampaign => ({
  id: record.id as string,
  eventId: record.eventId as string,
  editionId: record.editionId as string | undefined,
  name: record.name as string,
  templateId: record.templateId as string | undefined,
  segmentId: record.segmentId as string | undefined,
  subject: record.subject as string,
  bodyHtml: record.bodyHtml as string,
  bodyText: record.bodyText as string,
  status: (record.status as CampaignStatus) || 'draft',
  scheduledAt: record.scheduledAt ? new Date(record.scheduledAt as string) : undefined,
  sentAt: record.sentAt ? new Date(record.sentAt as string) : undefined,
  totalRecipients: (record.totalRecipients as number) || 0,
  totalSent: (record.totalSent as number) || 0,
  totalFailed: (record.totalFailed as number) || 0,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type EmailCampaignRepository = ReturnType<typeof createEmailCampaignRepository>
