import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  AlertLevel,
  AlertThreshold,
  ComparisonOperator,
  CreateAlertThreshold,
  MetricSource,
  UpdateAlertThreshold
} from '../domain/alert-threshold'

const COLLECTION = 'alert_thresholds'

export interface AlertThresholdListOptions {
  page?: number
  perPage?: number
  sort?: string
  enabledOnly?: boolean
}

export const createAlertThresholdRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<AlertThreshold | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToAlertThreshold(record)
    } catch {
      return null
    }
  },

  async findByEdition(
    editionId: string,
    options?: AlertThresholdListOptions
  ): Promise<AlertThreshold[]> {
    let filter = safeFilter`editionId = ${editionId}`
    if (options?.enabledOnly) {
      filter = safeFilter`editionId = ${editionId} && enabled = true`
    }

    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter,
        sort: options?.sort ?? '-created'
      })
    return records.items.map(mapRecordToAlertThreshold)
  },

  async findByMetricSource(
    editionId: string,
    metricSource: MetricSource
  ): Promise<AlertThreshold[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId} && metricSource = ${metricSource} && enabled = true`,
      sort: 'level'
    })
    return records.map(mapRecordToAlertThreshold)
  },

  async create(data: CreateAlertThreshold): Promise<AlertThreshold> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      emailRecipients: JSON.stringify(data.emailRecipients ?? [])
    })
    return mapRecordToAlertThreshold(record)
  },

  async update(id: string, data: UpdateAlertThreshold): Promise<AlertThreshold> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.emailRecipients !== undefined) {
      updateData.emailRecipients = JSON.stringify(data.emailRecipients)
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToAlertThreshold(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async toggleEnabled(id: string, enabled: boolean): Promise<AlertThreshold> {
    const record = await pb.collection(COLLECTION).update(id, { enabled })
    return mapRecordToAlertThreshold(record)
  },

  async countByEdition(editionId: string): Promise<{ total: number; enabled: number }> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'enabled'
    })

    const enabled = records.filter((r) => r.enabled).length

    return {
      total: records.length,
      enabled
    }
  }
})

const mapRecordToAlertThreshold = (record: Record<string, unknown>): AlertThreshold => {
  let emailRecipients: string[] = []
  if (record.emailRecipients) {
    try {
      emailRecipients =
        typeof record.emailRecipients === 'string'
          ? JSON.parse(record.emailRecipients)
          : (record.emailRecipients as string[])
    } catch {
      emailRecipients = []
    }
  }

  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    description: record.description as string | undefined,
    metricSource: record.metricSource as MetricSource,
    operator: record.operator as ComparisonOperator,
    thresholdValue: record.thresholdValue as number,
    level: record.level as AlertLevel,
    enabled: (record.enabled as boolean) ?? true,
    notifyByEmail: (record.notifyByEmail as boolean) ?? false,
    notifyInApp: (record.notifyInApp as boolean) ?? true,
    emailRecipients,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type AlertThresholdRepository = ReturnType<typeof createAlertThresholdRepository>
