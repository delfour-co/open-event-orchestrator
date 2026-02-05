import type { Order, OrderItem, Ticket, TicketType } from '../domain'

export interface OrderConfirmationData {
  order: Order
  items: Array<OrderItem & { ticketType?: TicketType }>
  tickets: Ticket[]
  editionName: string
  eventName: string
}

export const generateOrderConfirmationHtml = (data: OrderConfirmationData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const itemRows = data.items
    .map(
      (item) => `
		<tr>
			<td style="padding: 8px; border-bottom: 1px solid #eee;">${item.ticketTypeName}</td>
			<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
			<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.unitPrice)}</td>
			<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.totalPrice)}</td>
		</tr>
	`
    )
    .join('')

  const ticketRows = data.tickets
    .map(
      (ticket) => `
		<div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
			<div style="font-weight: bold; font-size: 16px;">${ticket.attendeeFirstName} ${ticket.attendeeLastName}</div>
			<div style="color: #666; margin-top: 4px;">Ticket #${ticket.ticketNumber}</div>
			${ticket.qrCode ? `<div style="text-align: center; margin-top: 12px;"><img src="${ticket.qrCode}" width="200" height="200" alt="QR Code" /></div>` : ''}
		</div>
	`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
	<h1 style="color: #333;">Order Confirmation</h1>
	<p>Hello ${data.order.firstName},</p>
	<p>Thank you for your order for <strong>${data.editionName}</strong>.</p>

	<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
		<div style="font-size: 14px; color: #666;">Order #${data.order.orderNumber}</div>
		<div style="font-size: 24px; font-weight: bold; margin-top: 4px;">${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}</div>
	</div>

	<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
		<thead>
			<tr style="background: #f3f4f6;">
				<th style="padding: 8px; text-align: left;">Ticket</th>
				<th style="padding: 8px; text-align: center;">Qty</th>
				<th style="padding: 8px; text-align: right;">Unit Price</th>
				<th style="padding: 8px; text-align: right;">Total</th>
			</tr>
		</thead>
		<tbody>${itemRows}</tbody>
	</table>

	<h2 style="margin-top: 30px;">Your Tickets</h2>
	<p>Present these QR codes at the entrance for check-in.</p>
	${ticketRows}

	<p style="color: #666; margin-top: 30px; font-size: 12px;">
		This email was sent by ${data.eventName}. If you have any questions, please contact the organizers.
	</p>
</body>
</html>
`
}

export interface OrderRefundData {
  order: Order
  items: Array<OrderItem & { ticketType?: TicketType }>
  editionName: string
  eventName: string
}

export const generateOrderRefundHtml = (data: OrderRefundData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const itemRows = data.items
    .map(
      (item) => `
		<tr>
			<td style="padding: 8px; border-bottom: 1px solid #eee;">${item.ticketTypeName}</td>
			<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
			<td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.totalPrice)}</td>
		</tr>
	`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
	<h1 style="color: #dc2626;">Order Refunded</h1>
	<p>Hello ${data.order.firstName},</p>
	<p>Your order for <strong>${data.editionName}</strong> has been refunded.</p>

	<div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
		<div style="font-size: 14px; color: #666;">Order #${data.order.orderNumber}</div>
		<div style="font-size: 24px; font-weight: bold; margin-top: 4px; color: #dc2626;">${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}</div>
		<div style="font-size: 14px; color: #dc2626; margin-top: 4px;">Refunded</div>
	</div>

	<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
		<thead>
			<tr style="background: #f3f4f6;">
				<th style="padding: 8px; text-align: left;">Ticket</th>
				<th style="padding: 8px; text-align: center;">Qty</th>
				<th style="padding: 8px; text-align: right;">Amount</th>
			</tr>
		</thead>
		<tbody>${itemRows}</tbody>
	</table>

	<p>All tickets associated with this order have been cancelled. If the order was paid by card, the refund will appear on your statement within 5-10 business days.</p>

	<p style="color: #666; margin-top: 30px; font-size: 12px;">
		This email was sent by ${data.eventName}. If you have any questions, please contact the organizers.
	</p>
</body>
</html>
`
}

export const generateOrderRefundText = (data: OrderRefundData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const items = data.items
    .map((item) => `- ${item.ticketTypeName} x${item.quantity}: ${formatPrice(item.totalPrice)}`)
    .join('\n')

  return `Order Refunded

Hello ${data.order.firstName},

Your order for ${data.editionName} has been refunded.

Order #${data.order.orderNumber}
Refunded amount: ${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}

Items:
${items}

All tickets associated with this order have been cancelled. If the order was paid by card, the refund will appear on your statement within 5-10 business days.

This email was sent by ${data.eventName}.`
}

export const generateOrderConfirmationText = (data: OrderConfirmationData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const items = data.items
    .map((item) => `- ${item.ticketTypeName} x${item.quantity}: ${formatPrice(item.totalPrice)}`)
    .join('\n')

  const tickets = data.tickets
    .map(
      (ticket) =>
        `- ${ticket.attendeeFirstName} ${ticket.attendeeLastName}: Ticket #${ticket.ticketNumber}`
    )
    .join('\n')

  return `Order Confirmation

Hello ${data.order.firstName},

Thank you for your order for ${data.editionName}.

Order #${data.order.orderNumber}
Total: ${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}

Items:
${items}

Your Tickets:
${tickets}

Present your ticket number at the entrance for check-in.

This email was sent by ${data.eventName}.`
}
