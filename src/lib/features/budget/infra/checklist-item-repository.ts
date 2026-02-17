import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { BudgetChecklistItem, CreateChecklistItem, UpdateChecklistItem } from '../domain'

const COLLECTION = 'budget_checklist_items'

const buildUpdateData = (data: UpdateChecklistItem): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}
  const fields: Array<[keyof UpdateChecklistItem, (v: unknown) => unknown]> = [
    ['categoryId', (v) => v || null],
    ['name', (v) => v],
    ['description', (v) => v || null],
    ['estimatedAmount', (v) => v],
    ['status', (v) => v],
    ['priority', (v) => v],
    ['dueDate', (v) => (v instanceof Date ? v.toISOString() : null)],
    ['assignee', (v) => v || null],
    ['notes', (v) => v || null],
    ['order', (v) => v],
    ['transactionId', (v) => v || null]
  ]
  for (const [key, transform] of fields) {
    if (data[key] !== undefined) {
      updateData[key] = transform(data[key])
    }
  }
  return updateData
}

export const createChecklistItemRepository = (pb: PocketBase) => ({
  async findByEdition(editionId: string): Promise<BudgetChecklistItem[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: 'order,created'
    })
    return records.map(mapRecordToChecklistItem)
  },

  async findByEditionAndStatus(editionId: string, status: string): Promise<BudgetChecklistItem[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId} && status = ${status}`,
      sort: 'order,created'
    })
    return records.map(mapRecordToChecklistItem)
  },

  async findByCategory(categoryId: string): Promise<BudgetChecklistItem[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`categoryId = ${categoryId}`,
      sort: 'order,created'
    })
    return records.map(mapRecordToChecklistItem)
  },

  async findById(id: string): Promise<BudgetChecklistItem | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToChecklistItem(record)
    } catch {
      return null
    }
  },

  async create(data: CreateChecklistItem): Promise<BudgetChecklistItem> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description || null,
      estimatedAmount: data.estimatedAmount || 0,
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      dueDate: data.dueDate?.toISOString() || null,
      assignee: data.assignee || null,
      notes: data.notes || null,
      order: data.order || 0,
      transactionId: data.transactionId || null,
      createdBy: data.createdBy
    })
    return mapRecordToChecklistItem(record)
  },

  async createMany(items: CreateChecklistItem[]): Promise<BudgetChecklistItem[]> {
    const results: BudgetChecklistItem[] = []
    for (const item of items) {
      const created = await pb.collection(COLLECTION).create({
        editionId: item.editionId,
        categoryId: item.categoryId || null,
        name: item.name,
        description: item.description || null,
        estimatedAmount: item.estimatedAmount || 0,
        status: item.status || 'pending',
        priority: item.priority || 'medium',
        dueDate: item.dueDate?.toISOString() || null,
        assignee: item.assignee || null,
        notes: item.notes || null,
        order: item.order || 0,
        transactionId: item.transactionId || null,
        createdBy: item.createdBy
      })
      results.push(mapRecordToChecklistItem(created))
    }
    return results
  },

  async update(id: string, data: UpdateChecklistItem): Promise<BudgetChecklistItem> {
    const record = await pb.collection(COLLECTION).update(id, buildUpdateData(data))
    return mapRecordToChecklistItem(record)
  },

  async updateOrder(id: string, order: number): Promise<void> {
    await pb.collection(COLLECTION).update(id, { order })
  },

  async reorder(items: Array<{ id: string; order: number }>): Promise<void> {
    for (const item of items) {
      await pb.collection(COLLECTION).update(item.id, { order: item.order })
    }
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByEdition(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'id'
    })
    return records.totalItems
  },

  async countByStatus(editionId: string, status: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId} && status = ${status}`,
      fields: 'id'
    })
    return records.totalItems
  },

  async sumEstimatedByEdition(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId} && status != "cancelled"`,
      fields: 'estimatedAmount'
    })
    return records.reduce((sum, r) => sum + ((r.estimatedAmount as number) || 0), 0)
  },

  async getNextOrder(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-order',
      fields: 'order'
    })
    if (records.items.length === 0) return 0
    return ((records.items[0].order as number) || 0) + 1
  }
})

const mapRecordToChecklistItem = (record: Record<string, unknown>): BudgetChecklistItem => ({
  id: record.id as string,
  editionId: record.editionId as string,
  categoryId: (record.categoryId as string) || undefined,
  name: record.name as string,
  description: (record.description as string) || undefined,
  estimatedAmount: (record.estimatedAmount as number) || 0,
  status: ((record.status as string) || 'pending') as
    | 'pending'
    | 'approved'
    | 'ordered'
    | 'paid'
    | 'cancelled',
  priority: ((record.priority as string) || 'medium') as 'low' | 'medium' | 'high',
  dueDate: record.dueDate ? new Date(record.dueDate as string) : undefined,
  assignee: (record.assignee as string) || undefined,
  notes: (record.notes as string) || undefined,
  order: (record.order as number) || 0,
  transactionId: (record.transactionId as string) || undefined,
  createdBy: record.createdBy as string,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ChecklistItemRepository = ReturnType<typeof createChecklistItemRepository>
