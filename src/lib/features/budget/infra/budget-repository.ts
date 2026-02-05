import type PocketBase from 'pocketbase'
import type { CreateBudget, EditionBudget, UpdateBudget } from '../domain'

const COLLECTION = 'edition_budgets'

export const createBudgetRepository = (pb: PocketBase) => ({
  async findByEdition(editionId: string): Promise<EditionBudget | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: `editionId = "${editionId}"`
      })
      if (records.items.length === 0) return null
      return mapRecordToBudget(records.items[0])
    } catch {
      return null
    }
  },

  async findById(id: string): Promise<EditionBudget | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToBudget(record)
    } catch {
      return null
    }
  },

  async create(data: CreateBudget): Promise<EditionBudget> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      totalBudget: data.totalBudget,
      currency: data.currency || 'EUR',
      status: data.status || 'draft',
      notes: data.notes || null
    })
    return mapRecordToBudget(record)
  },

  async update(id: string, data: UpdateBudget): Promise<EditionBudget> {
    const updateData: Record<string, unknown> = {}
    if (data.totalBudget !== undefined) updateData.totalBudget = data.totalBudget
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes || null
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToBudget(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const mapRecordToBudget = (record: Record<string, unknown>): EditionBudget => ({
  id: record.id as string,
  editionId: record.editionId as string,
  totalBudget: (record.totalBudget as number) || 0,
  currency: ((record.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
  status: ((record.status as string) || 'draft') as 'draft' | 'approved' | 'closed',
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type BudgetRepository = ReturnType<typeof createBudgetRepository>
