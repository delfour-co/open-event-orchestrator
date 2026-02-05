import type {
  OrderItemRepository,
  OrderRepository,
  TicketRepository,
  TicketTypeRepository
} from '../infra'

export const createRefundOrderUseCase = (
  orderRepository: OrderRepository,
  orderItemRepository: OrderItemRepository,
  ticketTypeRepository: TicketTypeRepository,
  ticketRepository: TicketRepository
) => {
  return async (orderId: string): Promise<void> => {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    if (order.status !== 'paid') {
      throw new Error(`Cannot refund order with status "${order.status}"`)
    }

    // Cancel all valid/used tickets
    const tickets = await ticketRepository.findByOrder(orderId)
    for (const ticket of tickets) {
      if (ticket.status === 'valid' || ticket.status === 'used') {
        await ticketRepository.updateStatus(ticket.id, 'cancelled')
      }
    }

    // Restore ticket type quantities
    const items = await orderItemRepository.findByOrder(orderId)
    for (const item of items) {
      await ticketTypeRepository.incrementQuantitySold(item.ticketTypeId, -item.quantity)
    }

    // Mark order as refunded
    await orderRepository.updateStatus(orderId, 'refunded')
  }
}

export type RefundOrderUseCase = ReturnType<typeof createRefundOrderUseCase>
