import { calculateItemTotal, generateOrderNumber } from '../domain'
import type { OrderItemRepository, OrderRepository, TicketTypeRepository } from '../infra'

export interface OrderLineItem {
  ticketTypeId: string
  quantity: number
}

export interface CreateOrderInput {
  editionId: string
  email: string
  firstName: string
  lastName: string
  currency: 'EUR' | 'USD' | 'GBP'
  items: OrderLineItem[]
}

export interface CreateOrderResult {
  orderId: string
  orderNumber: string
  totalAmount: number
  isFree: boolean
}

export const createCreateOrderUseCase = (
  orderRepository: OrderRepository,
  orderItemRepository: OrderItemRepository,
  ticketTypeRepository: TicketTypeRepository
) => {
  return async (input: CreateOrderInput): Promise<CreateOrderResult> => {
    // Validate all ticket types and check availability
    let totalAmount = 0
    const resolvedItems: Array<{
      ticketTypeId: string
      ticketTypeName: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }> = []

    for (const item of input.items) {
      const ticketType = await ticketTypeRepository.findById(item.ticketTypeId)
      if (!ticketType) {
        throw new Error(`Ticket type ${item.ticketTypeId} not found`)
      }
      if (!ticketType.isActive) {
        throw new Error(`Ticket type "${ticketType.name}" is not available`)
      }

      const remaining = ticketType.quantity - ticketType.quantitySold
      if (item.quantity > remaining) {
        throw new Error(
          `Not enough tickets available for "${ticketType.name}" (${remaining} remaining)`
        )
      }

      const itemTotal = calculateItemTotal(ticketType.price, item.quantity)
      totalAmount += itemTotal

      resolvedItems.push({
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        quantity: item.quantity,
        unitPrice: ticketType.price,
        totalPrice: itemTotal
      })
    }

    // Create order
    const orderNumber = generateOrderNumber()
    const order = await orderRepository.create({
      editionId: input.editionId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      totalAmount,
      currency: input.currency,
      orderNumber,
      status: 'pending'
    })

    // Create order items
    for (const item of resolvedItems) {
      await orderItemRepository.create({
        orderId: order.id,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item.ticketTypeName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })
    }

    return {
      orderId: order.id,
      orderNumber,
      totalAmount,
      isFree: totalAmount === 0
    }
  }
}

export type CreateOrderUseCase = ReturnType<typeof createCreateOrderUseCase>
