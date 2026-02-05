import type PocketBase from 'pocketbase'
import type { CreateOrderItem, OrderItem } from '../domain'

const COLLECTION = 'order_items'

export const createOrderItemRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<OrderItem | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToOrderItem(record)
    } catch {
      return null
    }
  },

  async findByOrder(orderId: string): Promise<OrderItem[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `orderId = "${orderId}"`,
      sort: 'created'
    })
    return records.map(mapRecordToOrderItem)
  },

  async create(data: CreateOrderItem): Promise<OrderItem> {
    const record = await pb.collection(COLLECTION).create(data)
    return mapRecordToOrderItem(record)
  }
})

const mapRecordToOrderItem = (record: Record<string, unknown>): OrderItem => ({
  id: record.id as string,
  orderId: record.orderId as string,
  ticketTypeId: record.ticketTypeId as string,
  ticketTypeName: record.ticketTypeName as string,
  quantity: record.quantity as number,
  unitPrice: record.unitPrice as number,
  totalPrice: record.totalPrice as number,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type OrderItemRepository = ReturnType<typeof createOrderItemRepository>
