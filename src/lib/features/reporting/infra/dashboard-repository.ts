import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateDashboardInput,
  Dashboard,
  DashboardLayout,
  RefreshInterval,
  UpdateDashboardInput
} from '../domain/dashboard'
import type { WidgetConfig } from '../domain/widget'

const COLLECTION = 'dashboard_configs'

export const createDashboardRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Dashboard | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToDashboard(record)
    } catch {
      return null
    }
  },

  async findByUserAndEdition(userId: string, editionId: string): Promise<Dashboard | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`userId = ${userId} && editionId = ${editionId}`
      })

      if (records.items.length === 0) {
        return null
      }

      return mapRecordToDashboard(records.items[0])
    } catch {
      return null
    }
  },

  async findByUser(userId: string): Promise<Dashboard[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`userId = ${userId}`,
      sort: '-updated'
    })

    return records.map(mapRecordToDashboard)
  },

  async create(data: CreateDashboardInput): Promise<Dashboard> {
    const record = await pb.collection(COLLECTION).create({
      userId: data.userId,
      editionId: data.editionId,
      layout: data.layout ?? 'grid',
      refreshInterval: data.refreshInterval ?? 'off',
      widgets: JSON.stringify(data.widgets ?? [])
    })

    return mapRecordToDashboard(record)
  },

  async update(id: string, data: UpdateDashboardInput): Promise<Dashboard> {
    const updateData: Record<string, unknown> = {}

    if (data.layout !== undefined) {
      updateData.layout = data.layout
    }
    if (data.refreshInterval !== undefined) {
      updateData.refreshInterval = data.refreshInterval
    }
    if (data.widgets !== undefined) {
      updateData.widgets = JSON.stringify(data.widgets)
    }

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToDashboard(record)
  },

  async upsert(userId: string, editionId: string, data: UpdateDashboardInput): Promise<Dashboard> {
    const existing = await this.findByUserAndEdition(userId, editionId)

    if (existing) {
      return this.update(existing.id, data)
    }

    return this.create({
      userId,
      editionId,
      layout: data.layout,
      refreshInterval: data.refreshInterval,
      widgets: data.widgets
    })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async deleteByUserAndEdition(userId: string, editionId: string): Promise<void> {
    const dashboard = await this.findByUserAndEdition(userId, editionId)
    if (dashboard) {
      await this.delete(dashboard.id)
    }
  }
})

const mapRecordToDashboard = (record: Record<string, unknown>): Dashboard => {
  let widgets: WidgetConfig[] = []

  try {
    widgets =
      typeof record.widgets === 'string'
        ? JSON.parse(record.widgets)
        : ((record.widgets as WidgetConfig[]) ?? [])
  } catch {
    widgets = []
  }

  return {
    id: record.id as string,
    userId: record.userId as string,
    editionId: record.editionId as string,
    layout: (record.layout as DashboardLayout) ?? 'grid',
    refreshInterval: (record.refreshInterval as RefreshInterval) ?? 'off',
    widgets,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>
