import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateNotification, Notification, NotificationType } from '../domain'

const COLLECTION = 'notifications'

export interface NotificationListOptions {
  page?: number
  perPage?: number
  sort?: string
  type?: NotificationType
  isRead?: boolean
  includeDeleted?: boolean
}

export interface NotificationCountResult {
  total: number
  unread: number
  byType: Record<NotificationType, number>
}

export const createNotificationRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Notification | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToNotification(record)
    } catch {
      return null
    }
  },

  async findByUser(
    userId: string,
    options?: NotificationListOptions
  ): Promise<{ items: Notification[]; totalItems: number; totalPages: number }> {
    const filters: string[] = [safeFilter`userId = ${userId}`]

    if (!options?.includeDeleted) {
      filters.push('deletedAt = null')
    }

    if (options?.type) {
      filters.push(safeFilter`type = ${options.type}`)
    }

    if (options?.isRead !== undefined) {
      filters.push(safeFilter`isRead = ${options.isRead}`)
    }

    const filter = filterAnd(...filters)

    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 20, {
        filter,
        sort: options?.sort ?? '-created'
      })

    return {
      items: records.items.map(mapRecordToNotification),
      totalItems: records.totalItems,
      totalPages: records.totalPages
    }
  },

  async findRecentByUser(userId: string, limit = 10): Promise<Notification[]> {
    const records = await pb.collection(COLLECTION).getList(1, limit, {
      filter: filterAnd(safeFilter`userId = ${userId}`, 'deletedAt = null'),
      sort: '-created',
      requestKey: null // Disable auto-cancellation for parallel requests
    })
    return records.items.map(mapRecordToNotification)
  },

  async countByUser(userId: string): Promise<NotificationCountResult> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`userId = ${userId}`, 'deletedAt = null'),
      fields: 'type,isRead'
    })

    const byType: Record<NotificationType, number> = {
      system: 0,
      alert: 0,
      reminder: 0,
      action: 0
    }

    let unread = 0

    for (const record of records) {
      const type = record.type as NotificationType
      byType[type]++
      if (!record.isRead) {
        unread++
      }
    }

    return {
      total: records.length,
      unread,
      byType
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: filterAnd(safeFilter`userId = ${userId}`, 'isRead = false', 'deletedAt = null'),
      fields: 'id',
      requestKey: null // Disable auto-cancellation for parallel requests
    })
    return records.totalItems
  },

  async create(data: CreateNotification): Promise<Notification> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      isRead: false,
      deletedAt: null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    })
    return mapRecordToNotification(record)
  },

  async createMany(data: CreateNotification[]): Promise<Notification[]> {
    const notifications: Notification[] = []

    for (const item of data) {
      const notification = await pb.collection(COLLECTION).create({
        ...item,
        isRead: false,
        deletedAt: null,
        metadata: item.metadata ? JSON.stringify(item.metadata) : null
      })
      notifications.push(mapRecordToNotification(notification))
    }

    return notifications
  },

  async markAsRead(id: string): Promise<Notification> {
    const record = await pb.collection(COLLECTION).update(id, {
      isRead: true
    })
    return mapRecordToNotification(record)
  },

  async markAllAsRead(userId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`userId = ${userId}`, 'isRead = false', 'deletedAt = null'),
      fields: 'id'
    })

    for (const record of records) {
      await pb.collection(COLLECTION).update(record.id, { isRead: true })
    }

    return records.length
  },

  async softDelete(id: string): Promise<Notification> {
    const record = await pb.collection(COLLECTION).update(id, {
      deletedAt: new Date().toISOString()
    })
    return mapRecordToNotification(record)
  },

  async softDeleteOlderThan(userId: string, date: Date): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(
        safeFilter`userId = ${userId}`,
        safeFilter`created < ${date.toISOString()}`,
        'deletedAt = null'
      ),
      fields: 'id'
    })

    for (const record of records) {
      await pb.collection(COLLECTION).update(record.id, {
        deletedAt: new Date().toISOString()
      })
    }

    return records.length
  },

  async permanentlyDelete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async cleanupDeleted(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`deletedAt != null && deletedAt < ${cutoffDate.toISOString()}`,
      fields: 'id'
    })

    for (const record of records) {
      await pb.collection(COLLECTION).delete(record.id)
    }

    return records.length
  }
})

const mapRecordToNotification = (record: Record<string, unknown>): Notification => ({
  id: record.id as string,
  userId: record.userId as string,
  type: record.type as NotificationType,
  title: record.title as string,
  message: record.message as string,
  isRead: (record.isRead as boolean) ?? false,
  link: (record.link as string | null) ?? null,
  metadata: parseMetadata(record.metadata),
  deletedAt: record.deletedAt ? new Date(record.deletedAt as string) : null,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

const parseMetadata = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null
  if (typeof value === 'object') return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return null
}

export type NotificationRepository = ReturnType<typeof createNotificationRepository>
