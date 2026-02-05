import { generateTicketNumber } from '../domain'
import type {
  OrderItemRepository,
  OrderRepository,
  TicketRepository,
  TicketTypeRepository
} from '../infra'

export interface CompleteOrderResult {
  orderId: string
  ticketIds: string[]
}

export const createCompleteOrderUseCase = (
  orderRepository: OrderRepository,
  orderItemRepository: OrderItemRepository,
  ticketTypeRepository: TicketTypeRepository,
  ticketRepository: TicketRepository,
  generateQrCode?: (data: string) => Promise<string>
) => {
  return async (orderId: string): Promise<CompleteOrderResult> => {
    const order = await orderRepository.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    if (order.status !== 'pending') {
      throw new Error(`Cannot complete order with status "${order.status}"`)
    }

    // Mark order as paid
    await orderRepository.updateStatus(orderId, 'paid')

    // Get order items
    const items = await orderItemRepository.findByOrder(orderId)

    // Generate tickets for each item
    const ticketIds: string[] = []

    for (const item of items) {
      // Increment quantity sold on ticket type
      await ticketTypeRepository.incrementQuantitySold(item.ticketTypeId, item.quantity)

      // Generate a ticket for each quantity
      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = generateTicketNumber()

        // Generate QR code with ticket data
        const qrPayload = JSON.stringify({
          ticketId: ticketNumber,
          ticketNumber,
          editionId: order.editionId
        })
        const qrCode = generateQrCode ? await generateQrCode(qrPayload) : undefined

        const ticket = await ticketRepository.create({
          orderId: order.id,
          ticketTypeId: item.ticketTypeId,
          editionId: order.editionId,
          attendeeEmail: order.email,
          attendeeFirstName: order.firstName,
          attendeeLastName: order.lastName,
          ticketNumber,
          qrCode
        })

        ticketIds.push(ticket.id)
      }
    }

    return {
      orderId,
      ticketIds
    }
  }
}

export type CompleteOrderUseCase = ReturnType<typeof createCompleteOrderUseCase>
