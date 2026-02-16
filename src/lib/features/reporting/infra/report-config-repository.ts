import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateReportConfig,
  DayOfWeek,
  RecipientRole,
  ReportConfig,
  ReportFrequency,
  ReportRecipient,
  ReportSection,
  UpdateReportConfig
} from '../domain/report-config'
import { calculateNextScheduledAt } from '../domain/report-config'

const COLLECTION = 'report_configs'

export interface ReportConfigListOptions {
  page?: number
  perPage?: number
  enabledOnly?: boolean
}

export const createReportConfigRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<ReportConfig | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToConfig(record)
    } catch {
      return null
    }
  },

  async findByEdition(
    editionId: string,
    options?: ReportConfigListOptions
  ): Promise<ReportConfig[]> {
    let filter = safeFilter`editionId = ${editionId}`
    if (options?.enabledOnly) {
      filter += ' && enabled = true'
    }

    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter,
        sort: '-created'
      })

    return records.items.map(mapRecordToConfig)
  },

  async findDueReports(beforeDate: Date = new Date()): Promise<ReportConfig[]> {
    const isoDate = beforeDate.toISOString()
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `enabled = true && nextScheduledAt <= "${isoDate}"`,
      sort: 'nextScheduledAt'
    })

    return records.map(mapRecordToConfig)
  },

  async create(data: CreateReportConfig): Promise<ReportConfig> {
    const nextScheduledAt = calculateNextScheduledAt({
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek,
      dayOfMonth: data.dayOfMonth,
      timeOfDay: data.timeOfDay,
      timezone: data.timezone
    })

    const record = await pb.collection(COLLECTION).create({
      ...data,
      recipientRoles: JSON.stringify(data.recipientRoles || ['admin', 'organizer']),
      recipients: JSON.stringify(data.recipients || []),
      sections: JSON.stringify(data.sections),
      nextScheduledAt: nextScheduledAt.toISOString()
    })

    return mapRecordToConfig(record)
  },

  async update(id: string, data: UpdateReportConfig): Promise<ReportConfig> {
    const updateData: Record<string, unknown> = { ...data }

    if (data.recipientRoles) {
      updateData.recipientRoles = JSON.stringify(data.recipientRoles)
    }
    if (data.recipients) {
      updateData.recipients = JSON.stringify(data.recipients)
    }
    if (data.sections) {
      updateData.sections = JSON.stringify(data.sections)
    }

    if (data.frequency || data.dayOfWeek || data.dayOfMonth || data.timeOfDay || data.timezone) {
      const current = await this.findById(id)
      if (current) {
        const nextScheduledAt = calculateNextScheduledAt({
          frequency: data.frequency ?? current.frequency,
          dayOfWeek: data.dayOfWeek ?? current.dayOfWeek,
          dayOfMonth: data.dayOfMonth ?? current.dayOfMonth,
          timeOfDay: data.timeOfDay ?? current.timeOfDay,
          timezone: data.timezone ?? current.timezone
        })
        updateData.nextScheduledAt = nextScheduledAt.toISOString()
      }
    }

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToConfig(record)
  },

  async markSent(id: string): Promise<ReportConfig> {
    const config = await this.findById(id)
    if (!config) {
      throw new Error(`Report config not found: ${id}`)
    }

    const lastSentAt = new Date()
    const nextScheduledAt = calculateNextScheduledAt(
      {
        frequency: config.frequency,
        dayOfWeek: config.dayOfWeek,
        dayOfMonth: config.dayOfMonth,
        timeOfDay: config.timeOfDay,
        timezone: config.timezone
      },
      lastSentAt
    )

    const record = await pb.collection(COLLECTION).update(id, {
      lastSentAt: lastSentAt.toISOString(),
      nextScheduledAt: nextScheduledAt.toISOString()
    })

    return mapRecordToConfig(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByEdition(editionId: string): Promise<{ total: number; enabled: number }> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'enabled'
    })

    return {
      total: records.length,
      enabled: records.filter((r) => r.enabled).length
    }
  }
})

const mapRecordToConfig = (record: Record<string, unknown>): ReportConfig => {
  let recipientRoles: RecipientRole[] = ['admin', 'organizer']
  let recipients: ReportRecipient[] = []
  let sections: ReportSection[] = []

  try {
    recipientRoles =
      typeof record.recipientRoles === 'string'
        ? JSON.parse(record.recipientRoles)
        : (record.recipientRoles as RecipientRole[]) || ['admin', 'organizer']
  } catch {
    recipientRoles = ['admin', 'organizer']
  }

  try {
    recipients =
      typeof record.recipients === 'string'
        ? JSON.parse(record.recipients)
        : (record.recipients as ReportRecipient[]) || []
  } catch {
    recipients = []
  }

  try {
    sections =
      typeof record.sections === 'string'
        ? JSON.parse(record.sections)
        : (record.sections as ReportSection[])
  } catch {
    sections = []
  }

  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    enabled: record.enabled as boolean,
    frequency: record.frequency as ReportFrequency,
    dayOfWeek: record.dayOfWeek as DayOfWeek | undefined,
    dayOfMonth: record.dayOfMonth as number | undefined,
    timeOfDay: record.timeOfDay as string,
    timezone: (record.timezone as string) || 'UTC',
    recipientRoles,
    recipients,
    sections,
    lastSentAt: record.lastSentAt ? new Date(record.lastSentAt as string) : undefined,
    nextScheduledAt: record.nextScheduledAt
      ? new Date(record.nextScheduledAt as string)
      : undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type ReportConfigRepository = ReturnType<typeof createReportConfigRepository>
