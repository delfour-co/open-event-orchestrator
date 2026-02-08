import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { BudgetQuote, CreateQuote, QuoteLineItem, UpdateQuote } from '../domain/quote'

const COLLECTION = 'budget_quotes'

export const createQuoteRepository = (pb: PocketBase) => ({
  async findByEdition(editionId: string): Promise<BudgetQuote[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created'
    })
    return records.map(mapRecordToQuote)
  },

  async findById(id: string): Promise<BudgetQuote | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToQuote(record)
    } catch {
      return null
    }
  },

  async create(data: CreateQuote & { quoteNumber: string }): Promise<BudgetQuote> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      quoteNumber: data.quoteNumber,
      vendor: data.vendor,
      vendorEmail: data.vendorEmail || null,
      vendorAddress: data.vendorAddress || null,
      description: data.description || null,
      items: data.items,
      totalAmount: data.totalAmount,
      currency: data.currency || 'EUR',
      status: data.status || 'draft',
      validUntil: data.validUntil ? data.validUntil.toISOString() : null,
      notes: data.notes || null
    })
    return mapRecordToQuote(record)
  },

  async update(id: string, data: UpdateQuote): Promise<BudgetQuote> {
    const updateData: Record<string, unknown> = {}
    if (data.vendor !== undefined) updateData.vendor = data.vendor
    if (data.vendorEmail !== undefined) updateData.vendorEmail = data.vendorEmail || null
    if (data.vendorAddress !== undefined) updateData.vendorAddress = data.vendorAddress || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.items !== undefined) updateData.items = data.items
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.status !== undefined) updateData.status = data.status
    if (data.validUntil !== undefined)
      updateData.validUntil = data.validUntil ? data.validUntil.toISOString() : null
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToQuote(record)
  },

  async updateStatus(
    id: string,
    status: string,
    extra?: { sentAt?: Date; transactionId?: string }
  ): Promise<BudgetQuote> {
    const updateData: Record<string, unknown> = { status }
    if (extra?.sentAt) updateData.sentAt = extra.sentAt.toISOString()
    if (extra?.transactionId) updateData.transactionId = extra.transactionId
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToQuote(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async getNextSequence(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-created',
      fields: 'id'
    })
    return records.totalItems + 1
  }
})

const mapRecordToQuote = (record: Record<string, unknown>): BudgetQuote => ({
  id: record.id as string,
  editionId: record.editionId as string,
  quoteNumber: (record.quoteNumber as string) || '',
  vendor: record.vendor as string,
  vendorEmail: (record.vendorEmail as string) || undefined,
  vendorAddress: (record.vendorAddress as string) || undefined,
  description: (record.description as string) || undefined,
  items: (record.items as QuoteLineItem[]) || [],
  totalAmount: (record.totalAmount as number) || 0,
  currency: ((record.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
  status: ((record.status as string) || 'draft') as
    | 'draft'
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'expired',
  validUntil: record.validUntil ? new Date(record.validUntil as string) : undefined,
  notes: (record.notes as string) || undefined,
  transactionId: (record.transactionId as string) || undefined,
  sentAt: record.sentAt ? new Date(record.sentAt as string) : undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type QuoteRepository = ReturnType<typeof createQuoteRepository>
