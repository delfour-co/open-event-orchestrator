import type PocketBase from 'pocketbase'
import type { BudgetCategory, CreateCategory, UpdateCategory } from '../domain'

const COLLECTION = 'budget_categories'

export const createCategoryRepository = (pb: PocketBase) => ({
  async findByBudget(budgetId: string): Promise<BudgetCategory[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `budgetId = "${budgetId}"`,
      sort: 'name'
    })
    return records.map(mapRecordToCategory)
  },

  async findById(id: string): Promise<BudgetCategory | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToCategory(record)
    } catch {
      return null
    }
  },

  async create(data: CreateCategory): Promise<BudgetCategory> {
    const record = await pb.collection(COLLECTION).create({
      budgetId: data.budgetId,
      name: data.name,
      plannedAmount: data.plannedAmount || 0,
      notes: data.notes || null
    })
    return mapRecordToCategory(record)
  },

  async update(id: string, data: UpdateCategory): Promise<BudgetCategory> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.plannedAmount !== undefined) updateData.plannedAmount = data.plannedAmount
    if (data.notes !== undefined) updateData.notes = data.notes || null
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToCategory(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToCategory = (record: Record<string, unknown>): BudgetCategory => ({
  id: record.id as string,
  budgetId: record.budgetId as string,
  name: record.name as string,
  plannedAmount: (record.plannedAmount as number) || 0,
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type CategoryRepository = ReturnType<typeof createCategoryRepository>
