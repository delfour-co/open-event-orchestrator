import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateSponsorMessage,
  MessageSenderType,
  SponsorMessage,
  SponsorMessageWithAttachmentUrls,
  UnreadCounts
} from '../domain'

const COLLECTION = 'sponsor_messages'

export const createSponsorMessageRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<SponsorMessage | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToSponsorMessage(record)
    } catch {
      return null
    }
  },

  async findByIdWithAttachmentUrls(id: string): Promise<SponsorMessageWithAttachmentUrls | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToSponsorMessageWithUrls(record, pb)
    } catch {
      return null
    }
  },

  async findByEditionSponsor(editionSponsorId: string): Promise<SponsorMessage[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      sort: 'created'
    })
    return records.map(mapRecordToSponsorMessage)
  },

  async findByEditionSponsorWithAttachmentUrls(
    editionSponsorId: string
  ): Promise<SponsorMessageWithAttachmentUrls[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      sort: 'created'
    })
    return records.map((r) => mapRecordToSponsorMessageWithUrls(r, pb))
  },

  async findUnreadByEditionSponsor(
    editionSponsorId: string,
    forSenderType: MessageSenderType
  ): Promise<SponsorMessage[]> {
    const oppositeType = forSenderType === 'organizer' ? 'sponsor' : 'organizer'
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`editionSponsorId = ${editionSponsorId}`,
        safeFilter`senderType = ${oppositeType}`,
        'readAt = null'
      ),
      sort: '-created'
    })
    return records.map(mapRecordToSponsorMessage)
  },

  async countUnreadByEditionSponsor(
    editionSponsorId: string,
    forSenderType: MessageSenderType
  ): Promise<number> {
    const oppositeType = forSenderType === 'organizer' ? 'sponsor' : 'organizer'
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: filterAnd(
        safeFilter`editionSponsorId = ${editionSponsorId}`,
        safeFilter`senderType = ${oppositeType}`,
        'readAt = null'
      )
    })
    return records.totalItems
  },

  async getUnreadCountsForEdition(
    editionId: string,
    forSenderType: MessageSenderType
  ): Promise<UnreadCounts> {
    const oppositeType = forSenderType === 'organizer' ? 'sponsor' : 'organizer'

    // Get all edition sponsors for this edition
    const editionSponsors = await pb.collection('edition_sponsors').getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'id'
    })

    const editionSponsorIds = editionSponsors.map((es) => es.id as string)

    if (editionSponsorIds.length === 0) {
      return { byEditionSponsor: {}, total: 0 }
    }

    // Get all unread messages for these edition sponsors
    const unreadMessages = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`senderType = ${oppositeType}`, 'readAt = null'),
      fields: 'editionSponsorId'
    })

    const byEditionSponsor: Record<string, number> = {}
    let total = 0

    for (const msg of unreadMessages) {
      const esId = msg.editionSponsorId as string
      if (editionSponsorIds.includes(esId)) {
        byEditionSponsor[esId] = (byEditionSponsor[esId] || 0) + 1
        total++
      }
    }

    return { byEditionSponsor, total }
  },

  async create(data: CreateSponsorMessage): Promise<SponsorMessage> {
    const formData = new FormData()
    formData.append('editionSponsorId', data.editionSponsorId)
    formData.append('senderType', data.senderType)
    if (data.senderUserId) formData.append('senderUserId', data.senderUserId)
    formData.append('senderName', data.senderName)
    if (data.subject) formData.append('subject', data.subject)
    formData.append('content', data.content)

    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToSponsorMessage(record)
  },

  async createWithAttachments(
    data: CreateSponsorMessage,
    attachments: File[]
  ): Promise<SponsorMessage> {
    const formData = new FormData()
    formData.append('editionSponsorId', data.editionSponsorId)
    formData.append('senderType', data.senderType)
    if (data.senderUserId) formData.append('senderUserId', data.senderUserId)
    formData.append('senderName', data.senderName)
    if (data.subject) formData.append('subject', data.subject)
    formData.append('content', data.content)

    for (const file of attachments) {
      formData.append('attachments', file)
    }

    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToSponsorMessage(record)
  },

  async markAsRead(id: string): Promise<SponsorMessage> {
    const record = await pb.collection(COLLECTION).update(id, {
      readAt: new Date().toISOString()
    })
    return mapRecordToSponsorMessage(record)
  },

  async markAllAsReadForEditionSponsor(
    editionSponsorId: string,
    forSenderType: MessageSenderType
  ): Promise<number> {
    const oppositeType = forSenderType === 'organizer' ? 'sponsor' : 'organizer'
    const unread = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`editionSponsorId = ${editionSponsorId}`,
        safeFilter`senderType = ${oppositeType}`,
        'readAt = null'
      ),
      fields: 'id'
    })

    for (const msg of unread) {
      await pb.collection(COLLECTION).update(msg.id as string, {
        readAt: new Date().toISOString()
      })
    }

    return unread.length
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  getAttachmentUrl(message: SponsorMessage, filename: string): string {
    return pb.files.getURL({ collectionId: COLLECTION, id: message.id }, filename)
  }
})

const mapRecordToSponsorMessage = (record: Record<string, unknown>): SponsorMessage => ({
  id: record.id as string,
  editionSponsorId: record.editionSponsorId as string,
  senderType: record.senderType as string as MessageSenderType,
  senderUserId: (record.senderUserId as string) || undefined,
  senderName: record.senderName as string,
  subject: (record.subject as string) || undefined,
  content: record.content as string,
  attachments: (record.attachments as string[]) || [],
  readAt: record.readAt ? new Date(record.readAt as string) : undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

const mapRecordToSponsorMessageWithUrls = (
  record: Record<string, unknown>,
  pb: PocketBase
): SponsorMessageWithAttachmentUrls => {
  const base = mapRecordToSponsorMessage(record)
  const attachmentUrls = base.attachments.map((filename) =>
    pb.files.getURL({ collectionId: COLLECTION, id: base.id }, filename)
  )
  return { ...base, attachmentUrls }
}

export type SponsorMessageRepository = ReturnType<typeof createSponsorMessageRepository>
