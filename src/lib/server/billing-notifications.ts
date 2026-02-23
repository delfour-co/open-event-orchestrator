import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTemplateRepository
} from '$lib/features/billing/infra'
import {
  type SellerInfo,
  type TicketTemplateColors,
  generateCreditNotePdf,
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  generateOrderInvoicePdf,
  generateOrderRefundHtml,
  generateOrderRefundText,
  getNextCreditNoteNumber,
  getNextInvoiceNumber
} from '$lib/features/billing/services'
import { recordCreditNote, recordIncome } from '$lib/features/budget/services'
import type { EmailAttachment } from '$lib/features/cfp/services/email-service'
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

    // Fetch ticket template and edition details for proper rendering
    let template: TicketTemplateColors | undefined
    let venue: string | undefined
    let startDate: Date | undefined
    try {
      const templateRepo = createTicketTemplateRepository(pb)
      const tpl = await templateRepo.findByEdition(order.editionId)
      if (tpl) {
        template = {
          primaryColor: tpl.primaryColor,
          backgroundColor: tpl.backgroundColor,
          textColor: tpl.textColor,
          accentColor: tpl.accentColor,
          logoUrl: templateRepo.getLogoUrl(tpl),
          customFooterText: tpl.customFooterText,
          showDate: tpl.showDate,
          showVenue: tpl.showVenue,
          showQrCode: tpl.showQrCode
        }
      }
      const editions = await pb.collection('editions').getList(1, 1, {
        filter: `id = "${order.editionId}"`
      })
      if (editions.items.length > 0) {
        venue = (editions.items[0].venue as string) || undefined
        if (editions.items[0].startDate) {
          startDate = new Date(editions.items[0].startDate as string)
        }
      }
    } catch {
      // Continue with defaults if template/edition fetch fails
    }

    const html = generateOrderConfirmationHtml({
      order,
      items,
      tickets,
      editionName,
      eventName,
      template,
      venue,
      startDate
    })

    const text = generateOrderConfirmationText({
      order,
      items,
      tickets,
      editionName,
      eventName
    })

    const subject = `Order Confirmation #${order.orderNumber} - ${editionName}`

    // Generate invoice PDF if order has a total > 0
    const attachments: EmailAttachment[] = []
    if (order.totalAmount > 0) {
      try {
        // Get organization vatRate and legal info
        let vatRate = 20
        let organizationId = ''
        let seller: SellerInfo | undefined
        const editions = await pb.collection('editions').getList(1, 1, {
          filter: `id = "${order.editionId}"`
        })
        if (editions.items.length > 0 && editions.items[0].eventId) {
          const event = await pb.collection('events').getOne(editions.items[0].eventId as string)
          organizationId = event.organizationId as string
          if (organizationId) {
            const org = await pb.collection('organizations').getOne(organizationId)
            vatRate = (org.vatRate as number) ?? 20
            seller = {
              name: org.name as string,
              legalName: (org.legalName as string) || undefined,
              legalForm: (org.legalForm as string) || undefined,
              rcsNumber: (org.rcsNumber as string) || undefined,
              shareCapital: (org.shareCapital as string) || undefined,
              siret: (org.siret as string) || undefined,
              vatNumber: (org.vatNumber as string) || undefined,
              address: (org.address as string) || undefined,
              city: (org.city as string) || undefined,
              postalCode: (org.postalCode as string) || undefined,
              country: (org.country as string) || undefined,
              contactEmail: (org.contactEmail as string) || undefined
            }
          }
        }

        // Generate sequential invoice number
        let invoiceNumber = order.invoiceNumber
        if (!invoiceNumber && organizationId) {
          invoiceNumber = await getNextInvoiceNumber(pb, organizationId)
          await pb.collection('orders').update(order.id, { invoiceNumber })
        }

        if (invoiceNumber) {
          const now = order.paidAt || new Date()
          const invoiceDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          const pdfBytes = await generateOrderInvoicePdf({
            invoiceNumber,
            invoiceDate,
            dueDate: invoiceDate,
            eventName,
            order,
            items,
            vatRate,
            seller
          })
          attachments.push({
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBytes,
            contentType: 'application/pdf'
          })

          await recordIncome({
            pb,
            editionId: order.editionId,
            description: `Ticket order #${order.orderNumber}`,
            amount: order.totalAmount / 100,
            invoiceNumber,
            pdfBytes,
            vendor: `${order.firstName} ${order.lastName}`,
            source: 'billing'
          }).catch((err) => console.error('[billing] Budget integration failed:', err))
        }
      } catch (err) {
        console.error('Failed to generate invoice PDF:', err)
        // Continue sending email without attachment
      }
    }

    const result = await emailService.send({
      to: order.email,
      subject,
      html,
      text,
      attachments: attachments.length > 0 ? attachments : undefined
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

    // Generate credit note PDF if original invoice exists
    const attachments: EmailAttachment[] = []
    if (order.totalAmount > 0 && order.invoiceNumber) {
      try {
        let vatRate = 20
        let organizationId = ''
        let seller: SellerInfo | undefined
        const editions = await pb.collection('editions').getList(1, 1, {
          filter: `id = "${order.editionId}"`
        })
        if (editions.items.length > 0 && editions.items[0].eventId) {
          const event = await pb.collection('events').getOne(editions.items[0].eventId as string)
          organizationId = event.organizationId as string
          if (organizationId) {
            const org = await pb.collection('organizations').getOne(organizationId)
            vatRate = (org.vatRate as number) ?? 20
            seller = {
              name: org.name as string,
              legalName: (org.legalName as string) || undefined,
              legalForm: (org.legalForm as string) || undefined,
              rcsNumber: (org.rcsNumber as string) || undefined,
              shareCapital: (org.shareCapital as string) || undefined,
              siret: (org.siret as string) || undefined,
              vatNumber: (org.vatNumber as string) || undefined,
              address: (org.address as string) || undefined,
              city: (org.city as string) || undefined,
              postalCode: (org.postalCode as string) || undefined,
              country: (org.country as string) || undefined,
              contactEmail: (org.contactEmail as string) || undefined
            }
          }
        }

        if (organizationId) {
          const creditNoteNumber = await getNextCreditNoteNumber(pb, organizationId)
          const now = new Date()
          const originalDate = order.paidAt || order.createdAt
          const pdfBytes = await generateCreditNotePdf({
            creditNoteNumber,
            creditNoteDate: now.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            originalInvoiceNumber: order.invoiceNumber,
            originalInvoiceDate: originalDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            eventName,
            order,
            items,
            vatRate,
            seller
          })
          attachments.push({
            filename: `credit-note-${creditNoteNumber}.pdf`,
            content: pdfBytes,
            contentType: 'application/pdf'
          })

          await recordCreditNote({
            pb,
            editionId: order.editionId,
            description: `Refund order #${order.orderNumber}`,
            amount: order.totalAmount / 100,
            creditNoteNumber,
            pdfBytes,
            vendor: `${order.firstName} ${order.lastName}`,
            source: 'billing'
          }).catch((err) => console.error('[billing] Budget credit note failed:', err))
        }
      } catch (err) {
        console.error('Failed to generate credit note PDF:', err)
      }
    }

    const result = await emailService.send({
      to: order.email,
      subject,
      html,
      text,
      attachments: attachments.length > 0 ? attachments : undefined
    })
    return result.success ? { success: true } : { success: false, error: result.error }
  } catch (err) {
    console.error('Failed to send refund email:', err)
    return { success: false, error: String(err) }
  }
}
