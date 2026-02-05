import type {
  OrderItemRepository,
  OrderRepository,
  TicketRepository,
  TicketTypeRepository
} from '../infra'

export const createCancelOrderUseCase = (
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
    if (order.status !== 'pending') {
      throw new Error(`Cannot cancel order with status "${order.status}"`)
    }

    // Cancel all tickets if any exist
    const tickets = await ticketRepository.findByOrder(orderId)
    for (const ticket of tickets) {
      if (ticket.status === 'valid') {
        await ticketRepository.updateStatus(ticket.id, 'cancelled')
      }
    }

    // Restore ticket type quantities
    const items = await orderItemRepository.findByOrder(orderId)
    for (const item of items) {
      await ticketTypeRepository.incrementQuantitySold(item.ticketTypeId, -item.quantity)
    }

    // Mark order as cancelled
    await orderRepository.updateStatus(orderId, 'cancelled')
  }
}

export type CancelOrderUseCase = ReturnType<typeof createCancelOrderUseCase>
