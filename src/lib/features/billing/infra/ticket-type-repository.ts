import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateTicketType, TicketType, UpdateTicketType } from '../domain'

const COLLECTION = 'ticket_types'

export const createTicketTypeRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<TicketType | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTicketType(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<TicketType[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: 'order,name'
    })
    return records.map(mapRecordToTicketType)
  },

  async findActiveByEdition(editionId: string): Promise<TicketType[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(safeFilter`editionId = ${editionId}`, 'isActive = true'),
      sort: 'order,price'
    })
    return records.map(mapRecordToTicketType)
  },

  async create(data: CreateTicketType): Promise<TicketType> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      quantitySold: 0,
      salesStartDate: data.salesStartDate?.toISOString() || null,
      salesEndDate: data.salesEndDate?.toISOString() || null
    })
    return mapRecordToTicketType(record)
  },

  async update(id: string, data: UpdateTicketType): Promise<TicketType> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.salesStartDate !== undefined) {
      updateData.salesStartDate = data.salesStartDate?.toISOString() || null
    }
    if (data.salesEndDate !== undefined) {
      updateData.salesEndDate = data.salesEndDate?.toISOString() || null
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToTicketType(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async incrementQuantitySold(id: string, amount: number): Promise<TicketType> {
    const current = await pb.collection(COLLECTION).getOne(id)
    const newQuantitySold = (current.quantitySold as number) + amount
    const record = await pb.collection(COLLECTION).update(id, {
      quantitySold: newQuantitySold
    })
    return mapRecordToTicketType(record)
  }
})

const mapRecordToTicketType = (record: Record<string, unknown>): TicketType => ({
  id: record.id as string,
  editionId: record.editionId as string,
  name: record.name as string,
  description: record.description as string | undefined,
  price: record.price as number,
  currency: (record.currency as 'EUR' | 'USD' | 'GBP') || 'EUR',
  quantity: record.quantity as number,
  quantitySold: (record.quantitySold as number) || 0,
  salesStartDate: record.salesStartDate ? new Date(record.salesStartDate as string) : undefined,
  salesEndDate: record.salesEndDate ? new Date(record.salesEndDate as string) : undefined,
  isActive: record.isActive as boolean,
  order: (record.order as number) || 0,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type TicketTypeRepository = ReturnType<typeof createTicketTypeRepository>
