import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Alert, AlertStatus, CreateAlert } from '../domain/alert'
import type { AlertLevel, MetricSource } from '../domain/alert-threshold'

const COLLECTION = 'alerts'

export interface AlertListOptions {
  page?: number
  perPage?: number
  sort?: string
  status?: AlertStatus | AlertStatus[]
  level?: AlertLevel | AlertLevel[]
}

export const createAlertRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Alert | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToAlert(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string, options?: AlertListOptions): Promise<Alert[]> {
    let filter = safeFilter`editionId = ${editionId}`

    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status]
      const statusFilter = statuses.map((s) => safeFilter`status = ${s}`).join(' || ')
      filter = filterAnd(filter, `(${statusFilter})`)
    }

    if (options?.level) {
      const levels = Array.isArray(options.level) ? options.level : [options.level]
      const levelFilter = levels.map((l) => safeFilter`level = ${l}`).join(' || ')
      filter = filterAnd(filter, `(${levelFilter})`)
    }

    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter,
        sort: options?.sort ?? '-created'
      })
    return records.items.map(mapRecordToAlert)
  },

  async findActiveByEdition(editionId: string): Promise<Alert[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId} && (status = "active" || status = "acknowledged")`,
      sort: '-created'
    })
    return records.map(mapRecordToAlert)
  },

  async findByThreshold(thresholdId: string): Promise<Alert[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`thresholdId = ${thresholdId}`,
      sort: '-created'
    })
    return records.map(mapRecordToAlert)
  },

  async findActiveByThreshold(thresholdId: string): Promise<Alert | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`thresholdId = ${thresholdId} && status = "active"`
      })
      if (records.items.length === 0) return null
      return mapRecordToAlert(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateAlert): Promise<Alert> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      status: 'active'
    })
    return mapRecordToAlert(record)
  },

  async acknowledge(id: string, userId: string): Promise<Alert> {
    const record = await pb.collection(COLLECTION).update(id, {
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString()
    })
    return mapRecordToAlert(record)
  },

  async resolve(id: string): Promise<Alert> {
    const record = await pb.collection(COLLECTION).update(id, {
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    })
    return mapRecordToAlert(record)
  },

  async dismiss(id: string, userId: string): Promise<Alert> {
    const record = await pb.collection(COLLECTION).update(id, {
      status: 'dismissed',
      dismissedBy: userId,
      dismissedAt: new Date().toISOString()
    })
    return mapRecordToAlert(record)
  },

  async countByEdition(editionId: string): Promise<{
    total: number
    byStatus: Record<AlertStatus, number>
    byLevel: Record<AlertLevel, number>
  }> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'status,level'
    })

    const byStatus: Record<AlertStatus, number> = {
      active: 0,
      acknowledged: 0,
      resolved: 0,
      dismissed: 0
    }

    const byLevel: Record<AlertLevel, number> = {
      info: 0,
      warning: 0,
      critical: 0
    }

    for (const record of records) {
      const status = record.status as AlertStatus
      const level = record.level as AlertLevel
      byStatus[status]++
      byLevel[level]++
    }

    return {
      total: records.length,
      byStatus,
      byLevel
    }
  },

  async countActiveByEdition(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId} && status = "active"`
    })
    return records.totalItems
  }
})

const mapRecordToAlert = (record: Record<string, unknown>): Alert => ({
  id: record.id as string,
  editionId: record.editionId as string,
  thresholdId: record.thresholdId as string,
  title: record.title as string,
  message: record.message as string,
  level: record.level as AlertLevel,
  metricSource: record.metricSource as MetricSource,
  currentValue: record.currentValue as number,
  thresholdValue: record.thresholdValue as number,
  status: (record.status as AlertStatus) || 'active',
  acknowledgedBy: record.acknowledgedBy as string | undefined,
  acknowledgedAt: record.acknowledgedAt ? new Date(record.acknowledgedAt as string) : undefined,
  resolvedAt: record.resolvedAt ? new Date(record.resolvedAt as string) : undefined,
  dismissedBy: record.dismissedBy as string | undefined,
  dismissedAt: record.dismissedAt ? new Date(record.dismissedAt as string) : undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type AlertRepository = ReturnType<typeof createAlertRepository>
