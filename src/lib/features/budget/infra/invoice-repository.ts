import type PocketBase from 'pocketbase'
import type { BudgetInvoice } from '../domain/invoice'

const COLLECTION = 'budget_invoices'

export const createInvoiceRepository = (pb: PocketBase) => ({
  async findByTransaction(transactionId: string): Promise<BudgetInvoice[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `transactionId = "${transactionId}"`,
      sort: '-issueDate'
    })
    return records.map(mapRecordToInvoice)
  },

  async findByEdition(transactionIds: string[]): Promise<BudgetInvoice[]> {
    if (transactionIds.length === 0) return []
    const filter = transactionIds.map((id) => `transactionId = "${id}"`).join(' || ')
    const records = await pb.collection(COLLECTION).getFullList({
      filter,
      sort: '-issueDate'
    })
    return records.map(mapRecordToInvoice)
  },

  async findAll(): Promise<BudgetInvoice[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      sort: '-issueDate'
    })
    return records.map(mapRecordToInvoice)
  },

  async findById(id: string): Promise<BudgetInvoice | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToInvoice(record)
    } catch {
      return null
    }
  },

  async create(formData: FormData): Promise<BudgetInvoice> {
    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToInvoice(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  getFileUrl(invoice: BudgetInvoice): string | null {
    if (!invoice.file) return null
    return pb.files.getURL(
      { id: invoice.id, collectionId: COLLECTION, collectionName: COLLECTION },
      invoice.file
    )
  }
})

const mapRecordToInvoice = (record: Record<string, unknown>): BudgetInvoice => ({
  id: record.id as string,
  transactionId: record.transactionId as string,
  invoiceNumber: (record.invoiceNumber as string) || '',
  file: (record.file as string) || undefined,
  issueDate: new Date(record.issueDate as string),
  dueDate: record.dueDate ? new Date(record.dueDate as string) : undefined,
  amount: (record.amount as number) || 0,
  notes: (record.notes as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type InvoiceRepository = ReturnType<typeof createInvoiceRepository>
