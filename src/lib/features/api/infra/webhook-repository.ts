import type PocketBase from 'pocketbase'
import type {
  CreateWebhook,
  UpdateWebhook,
  Webhook,
  WebhookEventType,
  WebhookScope
} from '../domain/webhook'

const COLLECTION = 'webhooks'

export const createWebhookRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Webhook | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToWebhook(record)
    } catch {
      return null
    }
  },

  async findByScope(scope: WebhookScope): Promise<Webhook[]> {
    const filters: string[] = ['isActive = true']

    if (scope.editionId) {
      filters.push(`(editionId = "${scope.editionId}" || editionId = "")`)
    }
    if (scope.eventId) {
      filters.push(`(eventId = "${scope.eventId}" || eventId = "")`)
    }
    if (scope.organizationId) {
      filters.push(`(organizationId = "${scope.organizationId}" || organizationId = "")`)
    }

    const records = await pb.collection(COLLECTION).getFullList({
      filter: filters.join(' && '),
      sort: 'created'
    })

    return records.map(mapRecordToWebhook)
  },

  async findActiveByEvent(event: WebhookEventType, scope: WebhookScope): Promise<Webhook[]> {
    const webhooks = await this.findByScope(scope)
    return webhooks.filter((wh) => wh.events.includes(event))
  },

  async findByOrganization(organizationId: string): Promise<Webhook[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToWebhook)
  },

  async findByEdition(editionId: string): Promise<Webhook[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToWebhook)
  },

  async create(data: CreateWebhook): Promise<Webhook> {
    const record = await pb.collection(COLLECTION).create({
      name: data.name,
      url: data.url,
      secret: data.secret,
      organizationId: data.organizationId || '',
      eventId: data.eventId || '',
      editionId: data.editionId || '',
      events: JSON.stringify(data.events),
      isActive: data.isActive ?? true,
      headers: data.headers ? JSON.stringify(data.headers) : null,
      retryCount: data.retryCount ?? 3,
      createdBy: data.createdBy
    })
    return mapRecordToWebhook(record)
  },

  async update(id: string, data: UpdateWebhook): Promise<Webhook> {
    const updateData = buildUpdateData(data)
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToWebhook(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async setActive(id: string, isActive: boolean): Promise<Webhook> {
    const record = await pb.collection(COLLECTION).update(id, { isActive })
    return mapRecordToWebhook(record)
  }
})

const mapRecordToWebhook = (record: Record<string, unknown>): Webhook => ({
  id: record.id as string,
  name: record.name as string,
  url: record.url as string,
  secret: record.secret as string,
  organizationId: (record.organizationId as string) || undefined,
  eventId: (record.eventId as string) || undefined,
  editionId: (record.editionId as string) || undefined,
  events: parseJsonField<WebhookEventType[]>(record.events, []),
  isActive: record.isActive as boolean,
  headers: parseJsonField<Record<string, string> | undefined>(record.headers, undefined),
  retryCount: record.retryCount as number,
  createdBy: record.createdBy as string,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

const parseJsonField = <T>(value: unknown, defaultValue: T): T => {
  if (!value) return defaultValue
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return defaultValue
    }
  }
  return value as T
}

const buildUpdateData = (data: UpdateWebhook): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.url !== undefined) updateData.url = data.url
  if (data.secret !== undefined) updateData.secret = data.secret
  if (data.organizationId !== undefined) updateData.organizationId = data.organizationId || ''
  if (data.eventId !== undefined) updateData.eventId = data.eventId || ''
  if (data.editionId !== undefined) updateData.editionId = data.editionId || ''
  if (data.events !== undefined) updateData.events = JSON.stringify(data.events)
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.headers !== undefined) {
    updateData.headers = data.headers ? JSON.stringify(data.headers) : null
  }
  if (data.retryCount !== undefined) updateData.retryCount = data.retryCount

  return updateData
}

export type WebhookRepository = ReturnType<typeof createWebhookRepository>
