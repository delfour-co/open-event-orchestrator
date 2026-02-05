import type PocketBase from 'pocketbase'
import type { BudgetTransaction, CreateTransaction, UpdateTransaction } from '../domain'

const COLLECTION = 'budget_transactions'

const buildUpdateData = (data: UpdateTransaction): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.description !== undefined) updateData.description = data.description
  if (data.vendor !== undefined) updateData.vendor = data.vendor || null
  if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber || null
  if (data.date !== undefined) updateData.date = data.date.toISOString()
  if (data.status !== undefined) updateData.status = data.status
  return updateData
}

export const createTransactionRepository = (pb: PocketBase) => ({
  async findByCategory(categoryId: string): Promise<BudgetTransaction[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `categoryId = "${categoryId}"`,
      sort: '-date'
    })
    return records.map(mapRecordToTransaction)
  },

  async findByBudget(categoryIds: string[]): Promise<BudgetTransaction[]> {
    if (categoryIds.length === 0) return []
    const filter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: '-date'
    })
    return records.map(mapRecordToTransaction)
  },

  async findById(id: string): Promise<BudgetTransaction | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTransaction(record)
    } catch {
      return null
    }
  },

  async create(data: CreateTransaction): Promise<BudgetTransaction> {
    const record = await pb.collection(COLLECTION).create({
      categoryId: data.categoryId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      vendor: data.vendor || null,
      invoiceNumber: data.invoiceNumber || null,
      date: data.date.toISOString(),
      status: data.status || 'pending'
    })
    return mapRecordToTransaction(record)
  },

  async update(id: string, data: UpdateTransaction): Promise<BudgetTransaction> {
    const record = await pb.collection(COLLECTION).update(id, buildUpdateData(data))
    return mapRecordToTransaction(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByCategory(categoryId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `categoryId = "${categoryId}"`,
      fields: 'id'
    })
    return records.totalItems
  },

  async sumByCategory(
    categoryId: string,
    type: 'expense' | 'income',
    status: 'paid' | 'pending' | 'cancelled' = 'paid'
  ): Promise<number> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `categoryId = "${categoryId}" && type = "${type}" && status = "${status}"`,
      fields: 'amount'
    })
    return records.reduce((sum, r) => sum + ((r.amount as number) || 0), 0)
  }
})

const mapRecordToTransaction = (record: Record<string, unknown>): BudgetTransaction => ({
  id: record.id as string,
  categoryId: record.categoryId as string,
  type: (record.type as 'expense' | 'income') || 'expense',
  amount: (record.amount as number) || 0,
  description: record.description as string,
  vendor: (record.vendor as string) || undefined,
  invoiceNumber: (record.invoiceNumber as string) || undefined,
  date: new Date(record.date as string),
  status: ((record.status as string) || 'pending') as 'pending' | 'paid' | 'cancelled',
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type TransactionRepository = ReturnType<typeof createTransactionRepository>
