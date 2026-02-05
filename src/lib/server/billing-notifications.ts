import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository
} from '$lib/features/billing/infra'
import {
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  generateOrderRefundHtml,
  generateOrderRefundText
} from '$lib/features/billing/services'
import { getEmailService } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'

export interface SendOrderEmailParams {
  pb: PocketBase
  orderId: string
  editionName: string
  eventName: string
}

export type SendOrderConfirmationParams = SendOrderEmailParams

export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, orderId, editionName, eventName } = params

  const orderRepo = createOrderRepository(pb)
  const orderItemRepo = createOrderItemRepository(pb)
  const ticketRepo = createTicketRepository(pb)

  try {
    const order = await orderRepo.findById(orderId)
    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const items = await orderItemRepo.findByOrder(orderId)
    const tickets = await ticketRepo.findByOrder(orderId)

    const emailService = await getEmailService(pb)

    const html = generateOrderConfirmationHtml({
      order,
      items,
      tickets,
      editionName,
      eventName
    })

    const text = generateOrderConfirmationText({
      order,
      items,
      tickets,
      editionName,
      eventName
    })

    const subject = `Order Confirmation #${order.orderNumber} - ${editionName}`

    const result = await emailService.send({
      to: order.email,
      subject,
      html,
      text
    })

    if (result.success) {
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (err) {
    console.error('Failed to send order confirmation:', err)
    return { success: false, error: String(err) }
  }
}

export async function sendOrderRefundEmail(
  params: SendOrderEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, orderId, editionName, eventName } = params

  const orderRepo = createOrderRepository(pb)
  const orderItemRepo = createOrderItemRepository(pb)

  try {
    const order = await orderRepo.findById(orderId)
    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const items = await orderItemRepo.findByOrder(orderId)
    const emailService = await getEmailService(pb)

    const html = generateOrderRefundHtml({ order, items, editionName, eventName })
    const text = generateOrderRefundText({ order, items, editionName, eventName })
    const subject = `Order Refunded #${order.orderNumber} - ${editionName}`

    const result = await emailService.send({ to: order.email, subject, html, text })
    return result.success ? { success: true } : { success: false, error: result.error }
  } catch (err) {
    console.error('Failed to send refund email:', err)
    return { success: false, error: String(err) }
  }
}
