import type PocketBase from 'pocketbase'
import type { CreateEmailLog, EmailLog, NotificationType } from '../domain'

const COLLECTION = 'email_logs'

export const createEmailLogRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<EmailLog | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToEmailLog(record)
    } catch {
      return null
    }
  },

  async findByTalk(talkId: string): Promise<EmailLog[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `talkId = "${talkId}"`,
      sort: '-sentAt'
    })
    return records.map(mapRecordToEmailLog)
  },

  async findBySpeaker(speakerId: string): Promise<EmailLog[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `speakerId = "${speakerId}"`,
      sort: '-sentAt'
    })
    return records.map(mapRecordToEmailLog)
  },

  async findByEdition(editionId: string): Promise<EmailLog[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-sentAt'
    })
    return records.map(mapRecordToEmailLog)
  },

  async findByType(editionId: string, type: NotificationType): Promise<EmailLog[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}" && type = "${type}"`,
      sort: '-sentAt'
    })
    return records.map(mapRecordToEmailLog)
  },

  async create(data: CreateEmailLog): Promise<EmailLog> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      sentAt: new Date().toISOString()
    })
    return mapRecordToEmailLog(record)
  },

  async updateStatus(
    id: string,
    status: 'sent' | 'failed' | 'pending',
    error?: string
  ): Promise<EmailLog> {
    const record = await pb.collection(COLLECTION).update(id, { status, error })
    return mapRecordToEmailLog(record)
  },

  async countByEdition(editionId: string): Promise<Record<string, number>> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'type,status'
    })

    const counts: Record<string, number> = {
      total: records.length,
      sent: 0,
      failed: 0,
      pending: 0
    }

    for (const record of records) {
      const status = record.status as string
      counts[status] = (counts[status] || 0) + 1
    }

    return counts
  }
})

const mapRecordToEmailLog = (record: Record<string, unknown>): EmailLog => ({
  id: record.id as string,
  talkId: record.talkId as string | undefined,
  speakerId: record.speakerId as string,
  editionId: record.editionId as string,
  type: record.type as NotificationType,
  to: record.to as string,
  subject: record.subject as string,
  sentAt: new Date(record.sentAt as string),
  status: record.status as 'sent' | 'failed' | 'pending',
  error: record.error as string | undefined
})

export type EmailLogRepository = ReturnType<typeof createEmailLogRepository>
