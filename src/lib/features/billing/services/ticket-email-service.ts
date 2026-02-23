import type { Order, OrderItem, Ticket, TicketType } from '../domain'
import { getContrastColor } from '../domain/ticket-template'

export interface TicketTemplateColors {
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  logoUrl?: string
  customFooterText?: string
  showDate?: boolean
  showVenue?: boolean
  showQrCode?: boolean
}

export interface OrderConfirmationData {
  order: Order
  items: Array<OrderItem & { ticketType?: TicketType }>
  tickets: Ticket[]
  editionName: string
  eventName: string
  template?: TicketTemplateColors
  venue?: string
  startDate?: Date
}

export const generateOrderConfirmationHtml = (data: OrderConfirmationData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const template = data.template || {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#10B981'
  }

  const showDate = template.showDate ?? true
  const showVenue = template.showVenue ?? true
  const showQrCode = template.showQrCode ?? true

  const headerTextColor = getContrastColor(template.primaryColor)

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

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Build a lookup from ticketTypeId to ticketTypeName
  const ticketTypeNames = new Map<string, string>()
  for (const item of data.items) {
    ticketTypeNames.set(item.ticketTypeId, item.ticketTypeName)
  }

  const ticketRows = data.tickets
    .map((ticket) => {
      const typeName = ticketTypeNames.get(ticket.ticketTypeId) || 'Ticket'

      const dateHtml =
        showDate && data.startDate
          ? `<div style="font-size: 12px; margin-top: 6px; color: ${template.textColor};">Date: ${formatDate(data.startDate)}</div>`
          : ''

      const venueHtml =
        showVenue && data.venue
          ? `<div style="font-size: 12px; color: ${template.textColor};">Venue: ${data.venue}</div>`
          : ''

      const qrHtml =
        showQrCode && ticket.qrCode
          ? `
			<td style="vertical-align: middle; padding: 16px; border-left: 2px dashed ${template.textColor}20; width: 140px; text-align: center;">
				<img src="${ticket.qrCode}" width="110" height="110" alt="QR Code" style="border: 1px solid ${template.textColor}20; border-radius: 4px; padding: 4px; background: white;" />
				<div style="font-size: 9px; color: ${template.textColor}99; margin-top: 4px;">Scan for check-in</div>
			</td>`
          : ''

      const footerHtml = template.customFooterText
        ? `<div style="font-size: 10px; color: ${template.textColor}99; margin-top: 6px;">${template.customFooterText}</div>`
        : ''

      return `
		<div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background: ${template.backgroundColor};">
			<div style="background: ${template.primaryColor}; color: ${headerTextColor}; padding: 10px 16px;">
				<!--[if mso]><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td><![endif]-->
				${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" style="height: 28px; width: auto; max-width: 80px; vertical-align: middle; margin-right: 10px;" />` : ''}
				<span style="font-weight: bold; font-size: 15px; vertical-align: middle;">${data.eventName}</span>
				<span style="font-size: 12px; opacity: 0.9; vertical-align: middle; margin-left: 6px;">${data.editionName}</span>
				<!--[if mso]></td></tr></table><![endif]-->
			</div>
			<table cellpadding="0" cellspacing="0" border="0" width="100%" style="color: ${template.textColor};">
				<tr>
					<td style="vertical-align: top; padding: 14px 16px;">
						<div style="font-weight: bold; color: ${template.primaryColor}; font-size: 13px;">${typeName}</div>
						<div style="font-weight: 600; font-size: 15px; margin-top: 6px;">${ticket.attendeeFirstName} ${ticket.attendeeLastName}</div>
						<div style="font-size: 12px; color: ${template.textColor}aa;">${ticket.attendeeEmail}</div>
						${dateHtml}
						${venueHtml}
						<div style="font-size: 12px; color: ${template.accentColor}; margin-top: 6px;">Ticket #${ticket.ticketNumber}</div>
						${footerHtml}
					</td>
					${qrHtml}
				</tr>
			</table>
		</div>
	`
    })
    .join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
	<div style="background: ${template.primaryColor}; color: ${headerTextColor}; padding: 20px; border-radius: 8px 8px 0 0;">
		${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" style="height: 40px; width: auto; max-width: 120px; margin-bottom: 12px;" />` : ''}
		<h1 style="margin: 0; font-size: 24px;">Order Confirmation</h1>
	</div>

	<div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
		<p style="color: ${template.textColor};">Hello ${data.order.firstName},</p>
		<p style="color: ${template.textColor};">Thank you for your order for <strong>${data.editionName}</strong>.</p>

		<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid ${template.primaryColor};">
			<div style="font-size: 14px; color: #666;">Order #${data.order.orderNumber}</div>
			<div style="font-size: 24px; font-weight: bold; margin-top: 4px; color: ${template.primaryColor};">${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}</div>
		</div>

		<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
			<thead>
				<tr style="background: #f3f4f6;">
					<th style="padding: 8px; text-align: left; color: ${template.textColor};">Ticket</th>
					<th style="padding: 8px; text-align: center; color: ${template.textColor};">Qty</th>
					<th style="padding: 8px; text-align: right; color: ${template.textColor};">Unit Price</th>
					<th style="padding: 8px; text-align: right; color: ${template.textColor};">Total</th>
				</tr>
			</thead>
			<tbody>${itemRows}</tbody>
		</table>

		<h2 style="margin-top: 30px; color: ${template.textColor};">Your Tickets</h2>
		<p style="color: ${template.textColor};">Present these QR codes at the entrance for check-in.</p>
		${ticketRows}

		<p style="color: #666; margin-top: 30px; font-size: 12px;">
			This email was sent by ${data.eventName}. If you have any questions, please contact the organizers.
		</p>
	</div>
</body>
</html>
`
}

export interface OrderRefundData {
  order: Order
  items: Array<OrderItem & { ticketType?: TicketType }>
  editionName: string
  eventName: string
  template?: TicketTemplateColors
}

export const generateOrderRefundHtml = (data: OrderRefundData): string => {
  const formatPrice = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} ${data.order.currency}`
  }

  const template = data.template || {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#10B981'
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
	<div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
		${template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" style="height: 40px; width: auto; max-width: 120px; margin-bottom: 12px;" />` : ''}
		<h1 style="margin: 0; font-size: 24px;">Order Refunded</h1>
	</div>

	<div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
		<p style="color: ${template.textColor};">Hello ${data.order.firstName},</p>
		<p style="color: ${template.textColor};">Your order for <strong>${data.editionName}</strong> has been refunded.</p>

		<div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #dc2626;">
			<div style="font-size: 14px; color: #666;">Order #${data.order.orderNumber}</div>
			<div style="font-size: 24px; font-weight: bold; margin-top: 4px; color: #dc2626;">${data.order.totalAmount === 0 ? 'Free' : formatPrice(data.order.totalAmount)}</div>
			<div style="font-size: 14px; color: #dc2626; margin-top: 4px;">Refunded</div>
		</div>

		<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
			<thead>
				<tr style="background: #f3f4f6;">
					<th style="padding: 8px; text-align: left; color: ${template.textColor};">Ticket</th>
					<th style="padding: 8px; text-align: center; color: ${template.textColor};">Qty</th>
					<th style="padding: 8px; text-align: right; color: ${template.textColor};">Amount</th>
				</tr>
			</thead>
			<tbody>${itemRows}</tbody>
		</table>

		<p style="color: ${template.textColor};">All tickets associated with this order have been cancelled. If the order was paid by card, the refund will appear on your statement within 5-10 business days.</p>

		<p style="color: #666; margin-top: 30px; font-size: 12px;">
			This email was sent by ${data.eventName}. If you have any questions, please contact the organizers.
		</p>
	</div>
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

  const ticketTypeNames = new Map<string, string>()
  for (const item of data.items) {
    ticketTypeNames.set(item.ticketTypeId, item.ticketTypeName)
  }

  const tickets = data.tickets
    .map((ticket) => {
      const typeName = ticketTypeNames.get(ticket.ticketTypeId) || 'Ticket'
      return `- ${typeName} | ${ticket.attendeeFirstName} ${ticket.attendeeLastName}: Ticket #${ticket.ticketNumber}`
    })
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
