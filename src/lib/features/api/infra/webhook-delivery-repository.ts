import type PocketBase from 'pocketbase'
import type { CreateWebhookDelivery, WebhookDelivery, WebhookEventType } from '../domain/webhook'

const COLLECTION = 'webhook_deliveries'

export interface UpdateDeliveryResult {
  statusCode?: number
  responseBody?: string
  deliveredAt?: Date
  error?: string
  nextRetryAt?: Date
  attempt?: number
}

export const createWebhookDeliveryRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<WebhookDelivery | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToDelivery(record)
    } catch {
      return null
    }
  },

  async findByWebhook(webhookId: string, page = 1, perPage = 50): Promise<WebhookDelivery[]> {
    const records = await pb.collection(COLLECTION).getList(page, perPage, {
      filter: `webhookId = "${webhookId}"`,
      sort: '-created'
    })
    return records.items.map(mapRecordToDelivery)
  },

  async findPendingRetries(): Promise<WebhookDelivery[]> {
    const now = new Date().toISOString()
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `deliveredAt = "" && nextRetryAt != "" && nextRetryAt <= "${now}"`,
      sort: 'nextRetryAt'
    })
    return records.map(mapRecordToDelivery)
  },

  async findFailedByWebhook(webhookId: string): Promise<WebhookDelivery[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `webhookId = "${webhookId}" && deliveredAt = "" && error != ""`,
      sort: '-created'
    })
    return records.map(mapRecordToDelivery)
  },

  async findRecentByWebhook(webhookId: string, limit = 10): Promise<WebhookDelivery[]> {
    const records = await pb.collection(COLLECTION).getList(1, limit, {
      filter: `webhookId = "${webhookId}"`,
      sort: '-created'
    })
    return records.items.map(mapRecordToDelivery)
  },

  async create(data: CreateWebhookDelivery): Promise<WebhookDelivery> {
    const record = await pb.collection(COLLECTION).create({
      webhookId: data.webhookId,
      event: data.event,
      payload: JSON.stringify(data.payload),
      attempt: data.attempt ?? 1,
      nextRetryAt: data.nextRetryAt ? data.nextRetryAt.toISOString() : null
    })
    return mapRecordToDelivery(record)
  },

  async updateResult(id: string, result: UpdateDeliveryResult): Promise<WebhookDelivery> {
    const updateData: Record<string, unknown> = {}

    if (result.statusCode !== undefined) updateData.statusCode = result.statusCode
    if (result.responseBody !== undefined) updateData.responseBody = result.responseBody
    if (result.deliveredAt !== undefined) updateData.deliveredAt = result.deliveredAt.toISOString()
    if (result.error !== undefined) updateData.error = result.error
    if (result.nextRetryAt !== undefined) updateData.nextRetryAt = result.nextRetryAt.toISOString()
    if (result.attempt !== undefined) updateData.attempt = result.attempt

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToDelivery(record)
  },

  async markDelivered(
    id: string,
    statusCode: number,
    responseBody?: string
  ): Promise<WebhookDelivery> {
    return this.updateResult(id, {
      statusCode,
      responseBody,
      deliveredAt: new Date(),
      nextRetryAt: undefined
    })
  },

  async markFailed(
    id: string,
    error: string,
    nextRetryAt?: Date,
    attempt?: number
  ): Promise<WebhookDelivery> {
    return this.updateResult(id, {
      error,
      nextRetryAt,
      attempt
    })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async deleteByWebhook(webhookId: string): Promise<void> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `webhookId = "${webhookId}"`
    })
    for (const record of records) {
      await pb.collection(COLLECTION).delete(record.id)
    }
  },

  async countByWebhook(
    webhookId: string
  ): Promise<{ total: number; delivered: number; failed: number }> {
    const all = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `webhookId = "${webhookId}"`
    })
    const delivered = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `webhookId = "${webhookId}" && deliveredAt != ""`
    })
    const failed = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `webhookId = "${webhookId}" && deliveredAt = "" && error != ""`
    })

    return {
      total: all.totalItems,
      delivered: delivered.totalItems,
      failed: failed.totalItems
    }
  }
})

const mapRecordToDelivery = (record: Record<string, unknown>): WebhookDelivery => ({
  id: record.id as string,
  webhookId: record.webhookId as string,
  event: record.event as WebhookEventType,
  payload: parseJsonField<Record<string, unknown>>(record.payload, {}),
  statusCode: (record.statusCode as number) || undefined,
  responseBody: (record.responseBody as string) || undefined,
  attempt: record.attempt as number,
  nextRetryAt: record.nextRetryAt ? new Date(record.nextRetryAt as string) : undefined,
  deliveredAt: record.deliveredAt ? new Date(record.deliveredAt as string) : undefined,
  error: (record.error as string) || undefined,
  createdAt: new Date(record.created as string)
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

export type WebhookDeliveryRepository = ReturnType<typeof createWebhookDeliveryRepository>
