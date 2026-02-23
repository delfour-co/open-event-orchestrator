import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Order, OrderItem } from '../domain'
import {
  LINE_HEIGHT,
  MARGIN,
  MUTED_COLOR,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  REFUND_COLOR,
  type SellerInfo,
  TEXT_COLOR,
  drawLegalMentions,
  drawSellerBlock,
  formatPrice
} from './pdf-shared'

export interface CreditNoteData {
  creditNoteNumber: string
  creditNoteDate: string
  originalInvoiceNumber: string
  originalInvoiceDate: string
  eventName: string
  order: Order
  items: OrderItem[]
  vatRate: number
  seller?: SellerInfo
}

export const generateCreditNotePdf = async (data: CreditNoteData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fonts = { bold, regular }

  let y = PAGE_HEIGHT - MARGIN

  // Header: event name
  page.drawText(data.eventName, {
    x: MARGIN,
    y,
    size: 22,
    font: bold,
    color: REFUND_COLOR
  })
  y -= 10

  page.drawRectangle({
    x: MARGIN,
    y,
    width: PAGE_WIDTH - 2 * MARGIN,
    height: 2,
    color: REFUND_COLOR
  })
  y -= 30

  // Credit note title
  page.drawText('AVOIR / CREDIT NOTE', {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: REFUND_COLOR
  })
  y -= LINE_HEIGHT

  page.drawText(`Credit Note #: ${data.creditNoteNumber}`, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })
  page.drawText(`Date: ${data.creditNoteDate}`, {
    x: PAGE_WIDTH / 2,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })
  y -= LINE_HEIGHT

  // Reference to original invoice
  page.drawText(
    `Cancels invoice #${data.originalInvoiceNumber} dated ${data.originalInvoiceDate}`,
    { x: MARGIN, y, size: 10, font: bold, color: TEXT_COLOR }
  )
  y -= 30

  // Bill To + Seller block
  const billToY = y

  page.drawText('Bill To:', {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  const fullName = `${data.order.firstName} ${data.order.lastName}`
  page.drawText(fullName, {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  page.drawText(data.order.email, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  page.drawText(`Order #${data.order.orderNumber}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })
  y -= 30

  // Seller block (right side)
  if (data.seller) {
    drawSellerBlock(page, data.seller, fonts, billToY)
  }

  // Table header
  const tableLeft = MARGIN
  const tableRight = PAGE_WIDTH - MARGIN
  const tableWidth = tableRight - tableLeft
  const descCol = tableLeft + 10
  const qtyCol = tableLeft + 280
  const unitCol = tableLeft + 340
  const amountCol = tableRight - 80

  page.drawRectangle({
    x: tableLeft,
    y: y - 5,
    width: tableWidth,
    height: 25,
    color: rgb(0.95, 0.95, 0.95)
  })

  page.drawText('Description', { x: descCol, y: y + 2, size: 10, font: bold, color: TEXT_COLOR })
  page.drawText('Qty', { x: qtyCol, y: y + 2, size: 10, font: bold, color: TEXT_COLOR })
  page.drawText('Unit Price', { x: unitCol, y: y + 2, size: 10, font: bold, color: TEXT_COLOR })
  page.drawText('Amount', { x: amountCol, y: y + 2, size: 10, font: bold, color: TEXT_COLOR })
  y -= 30

  // Table rows (negative amounts)
  const vatRate = data.vatRate ?? 0
  let totalCentsHt = 0

  for (const item of data.items) {
    const itemHt = vatRate > 0 ? Math.round(item.totalPrice / (1 + vatRate / 100)) : item.totalPrice

    page.drawText(item.ticketTypeName, {
      x: descCol,
      y,
      size: 10,
      font: regular,
      color: TEXT_COLOR
    })
    page.drawText(String(item.quantity), {
      x: qtyCol,
      y,
      size: 10,
      font: regular,
      color: TEXT_COLOR
    })
    const unitHt = vatRate > 0 ? Math.round(item.unitPrice / (1 + vatRate / 100)) : item.unitPrice
    page.drawText(`-${formatPrice(unitHt, data.order.currency)}`, {
      x: unitCol,
      y,
      size: 10,
      font: regular,
      color: REFUND_COLOR
    })
    page.drawText(`-${formatPrice(itemHt, data.order.currency)}`, {
      x: amountCol,
      y,
      size: 10,
      font: regular,
      color: REFUND_COLOR
    })

    totalCentsHt += itemHt
    y -= LINE_HEIGHT
  }

  // Separator
  y -= 5
  page.drawRectangle({
    x: tableLeft,
    y,
    width: tableWidth,
    height: 1,
    color: rgb(0.85, 0.85, 0.85)
  })
  y -= 20

  const totalCents = data.order.totalAmount
  const vatCents = totalCents - totalCentsHt

  // Subtotal HT
  page.drawText('Subtotal (HT):', {
    x: amountCol - 80,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatPrice(totalCentsHt, data.order.currency)}`, {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: REFUND_COLOR
  })
  y -= LINE_HEIGHT

  // VAT line
  const vatLabel = vatRate > 0 ? `VAT (${vatRate}%):` : 'VAT (exempt):'
  page.drawText(vatLabel, {
    x: amountCol - 80,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatPrice(vatCents, data.order.currency)}`, {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: REFUND_COLOR
  })
  y -= LINE_HEIGHT + 5

  // Separator before total
  page.drawRectangle({
    x: amountCol - 80,
    y: y + 3,
    width: PAGE_WIDTH - MARGIN - (amountCol - 80),
    height: 1,
    color: rgb(0.7, 0.7, 0.7)
  })

  // Net to deduct (TTC)
  page.drawText('Net to deduct (TTC):', {
    x: amountCol - 100,
    y: y - 5,
    size: 12,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatPrice(totalCents, data.order.currency)}`, {
    x: amountCol,
    y: y - 5,
    size: 12,
    font: bold,
    color: REFUND_COLOR
  })
  y -= 40

  // Status
  page.drawText('Status: REFUNDED', {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: REFUND_COLOR
  })
  y -= 30

  // Legal mentions
  drawLegalMentions(page, vatRate, fonts, y)

  // Footer
  page.drawText('This credit note cancels and replaces the referenced invoice.', {
    x: MARGIN,
    y: MARGIN + 10,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })

  return pdfDoc.save()
}
