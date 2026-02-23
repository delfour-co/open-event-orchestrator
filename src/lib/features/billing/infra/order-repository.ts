import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateOrder, Order, OrderStatus } from '../domain'

const COLLECTION = 'orders'

export interface OrderListOptions {
  page?: number
  perPage?: number
  sort?: string
}

export const createOrderRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<Order | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToOrder(record)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string, options?: OrderListOptions): Promise<Order[]> {
    const records = await pb
      .collection(COLLECTION)
      .getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter: safeFilter`editionId = ${editionId}`,
        sort: options?.sort ?? '-created'
      })
    return records.items.map(mapRecordToOrder)
  },

  async findByEmail(email: string, editionId?: string): Promise<Order[]> {
    const emailFilter = safeFilter`email = ${email}`
    const editionFilter = editionId ? safeFilter`editionId = ${editionId}` : undefined
    const records = await pb.collection(COLLECTION).getFullList({
      filter: filterAnd(emailFilter, editionFilter),
      sort: '-created'
    })
    return records.map(mapRecordToOrder)
  },

  async findByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`stripeSessionId = ${stripeSessionId}`
      })
      if (records.items.length === 0) return null
      return mapRecordToOrder(records.items[0])
    } catch {
      return null
    }
  },

  async create(data: CreateOrder & { orderNumber: string; status?: OrderStatus }): Promise<Order> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      status: data.status || 'pending'
    })
    return mapRecordToOrder(record)
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updateData: Record<string, unknown> = { status }
    if (status === 'paid') {
      updateData.paidAt = new Date().toISOString()
    }
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString()
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToOrder(record)
  },

  async updatePaymentInfo(
    id: string,
    data: { stripeSessionId?: string; stripePaymentIntentId?: string }
  ): Promise<Order> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToOrder(record)
  },

  async countByEdition(
    editionId: string
  ): Promise<{ total: number; byStatus: Record<OrderStatus, number>; totalRevenue: number }> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'status,totalAmount'
    })

    const byStatus: Record<OrderStatus, number> = {
      pending: 0,
      paid: 0,
      cancelled: 0,
      refunded: 0
    }

    let totalRevenue = 0
    for (const record of records) {
      const status = record.status as OrderStatus
      byStatus[status]++
      if (status === 'paid') {
        totalRevenue += record.totalAmount as number
      }
    }

    return {
      total: records.length,
      byStatus,
      totalRevenue
    }
  }
})

const mapRecordToOrder = (record: Record<string, unknown>): Order => ({
  id: record.id as string,
  editionId: record.editionId as string,
  orderNumber: record.orderNumber as string,
  email: record.email as string,
  firstName: record.firstName as string,
  lastName: record.lastName as string,
  status: (record.status as OrderStatus) || 'pending',
  totalAmount: record.totalAmount as number,
  currency: (record.currency as 'EUR' | 'USD' | 'GBP') || 'EUR',
  stripeSessionId: record.stripeSessionId as string | undefined,
  stripePaymentIntentId: record.stripePaymentIntentId as string | undefined,
  invoiceNumber: (record.invoiceNumber as string) || undefined,
  paymentProvider: (record.paymentProvider as string) || undefined,
  billingAddress: (record.billingAddress as string) || undefined,
  billingCity: (record.billingCity as string) || undefined,
  billingPostalCode: (record.billingPostalCode as string) || undefined,
  billingCountry: (record.billingCountry as string) || undefined,
  invoicePdf: (record.invoicePdf as string) || undefined,
  paidAt: record.paidAt ? new Date(record.paidAt as string) : undefined,
  cancelledAt: record.cancelledAt ? new Date(record.cancelledAt as string) : undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type OrderRepository = ReturnType<typeof createOrderRepository>
