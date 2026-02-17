import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  BudgetTemplate,
  CreateBudgetTemplate,
  TemplateItem,
  UpdateBudgetTemplate
} from '../domain'

const COLLECTION = 'budget_templates'

const buildUpdateData = (data: UpdateBudgetTemplate): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.eventType !== undefined) updateData.eventType = data.eventType
  if (data.isGlobal !== undefined) updateData.isGlobal = data.isGlobal
  if (data.organizationId !== undefined) updateData.organizationId = data.organizationId || null
  if (data.items !== undefined) updateData.items = JSON.stringify(data.items)
  return updateData
}

export const createBudgetTemplateRepository = (pb: PocketBase) => ({
  async findAll(): Promise<BudgetTemplate[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      sort: '-usageCount,name'
    })
    return records.map(mapRecordToTemplate)
  },

  async findGlobal(): Promise<BudgetTemplate[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`isGlobal = ${true}`,
      sort: '-usageCount,name'
    })
    return records.map(mapRecordToTemplate)
  },

  async findByOrganization(organizationId: string): Promise<BudgetTemplate[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`organizationId = ${organizationId} || isGlobal = ${true}`,
      sort: '-usageCount,name'
    })
    return records.map(mapRecordToTemplate)
  },

  async findByEventType(eventType: string): Promise<BudgetTemplate[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`eventType = ${eventType}`,
      sort: '-usageCount,name'
    })
    return records.map(mapRecordToTemplate)
  },

  async findById(id: string): Promise<BudgetTemplate | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTemplate(record)
    } catch {
      return null
    }
  },

  async create(data: CreateBudgetTemplate): Promise<BudgetTemplate> {
    const record = await pb.collection(COLLECTION).create({
      name: data.name,
      description: data.description || null,
      eventType: data.eventType,
      isGlobal: data.isGlobal || false,
      organizationId: data.organizationId || null,
      items: JSON.stringify(data.items || []),
      usageCount: 0,
      createdBy: data.createdBy
    })
    return mapRecordToTemplate(record)
  },

  async update(id: string, data: UpdateBudgetTemplate): Promise<BudgetTemplate> {
    const record = await pb.collection(COLLECTION).update(id, buildUpdateData(data))
    return mapRecordToTemplate(record)
  },

  async incrementUsageCount(id: string): Promise<void> {
    const template = await pb.collection(COLLECTION).getOne(id)
    const currentCount = (template.usageCount as number) || 0
    await pb.collection(COLLECTION).update(id, { usageCount: currentCount + 1 })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async count(): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      fields: 'id'
    })
    return records.totalItems
  }
})

const mapRecordToTemplate = (record: Record<string, unknown>): BudgetTemplate => {
  let items: TemplateItem[] = []
  try {
    const rawItems = record.items
    if (typeof rawItems === 'string') {
      items = JSON.parse(rawItems)
    } else if (Array.isArray(rawItems)) {
      items = rawItems as TemplateItem[]
    }
  } catch {
    items = []
  }

  return {
    id: record.id as string,
    name: record.name as string,
    description: (record.description as string) || undefined,
    eventType: record.eventType as string as
      | 'conference'
      | 'meetup'
      | 'workshop'
      | 'hackathon'
      | 'other',
    isGlobal: (record.isGlobal as boolean) || false,
    organizationId: (record.organizationId as string) || undefined,
    items,
    usageCount: (record.usageCount as number) || 0,
    createdBy: record.createdBy as string,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type BudgetTemplateRepository = ReturnType<typeof createBudgetTemplateRepository>
