import type PocketBase from 'pocketbase'
import type { ReimbursementItem } from '../domain/reimbursement'

const COLLECTION = 'reimbursement_items'

export const createReimbursementItemRepository = (pb: PocketBase) => ({
  async findByRequest(requestId: string): Promise<ReimbursementItem[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `requestId = "${requestId}"`,
      sort: 'date'
    })
    return records.map(mapRecordToItem)
  },

  async findById(id: string): Promise<ReimbursementItem | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToItem(record)
    } catch {
      return null
    }
  },

  async create(formData: FormData): Promise<ReimbursementItem> {
    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToItem(record)
  },

  async update(id: string, formData: FormData): Promise<ReimbursementItem> {
    const record = await pb.collection(COLLECTION).update(id, formData)
    return mapRecordToItem(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  getReceiptUrl(item: ReimbursementItem): string | null {
    if (!item.receipt) return null
    return pb.files.getURL(
      { id: item.id, collectionId: COLLECTION, collectionName: COLLECTION },
      item.receipt
    )
  }
})

const mapRecordToItem = (record: Record<string, unknown>): ReimbursementItem => ({
  id: record.id as string,
  requestId: record.requestId as string,
  expenseType: ((record.expenseType as string) || 'other') as
    | 'transport'
    | 'accommodation'
    | 'meals'
    | 'other',
  description: record.description as string,
  amount: (record.amount as number) || 0,
  date: new Date(record.date as string),
  receipt: (record.receipt as string) || undefined,
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type ReimbursementItemRepository = ReturnType<typeof createReimbursementItemRepository>
