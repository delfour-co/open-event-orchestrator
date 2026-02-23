import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Order, OrderItem } from '../domain'
import {
  LINE_HEIGHT,
  MARGIN,
  MUTED_COLOR,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PDF_LABELS,
  PRIMARY_COLOR,
  type SellerInfo,
  TEXT_COLOR,
  drawLegalMentions,
  drawSellerBlock,
  formatPrice
} from './pdf-shared'

export type { SellerInfo }

export interface OrderInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  eventName: string
  order: Order
  items: OrderItem[]
  vatRate: number
  seller?: SellerInfo
}

export const generateOrderInvoicePdf = async (data: OrderInvoiceData): Promise<Uint8Array> => {
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
    color: PRIMARY_COLOR
  })
  y -= 10

  page.drawRectangle({
    x: MARGIN,
    y,
    width: PAGE_WIDTH - 2 * MARGIN,
    height: 2,
    color: PRIMARY_COLOR
  })
  y -= 30

  // Invoice title and number
  page.drawText(PDF_LABELS.INVOICE_TITLE, {
    x: MARGIN,
    y,
    size: 16,
    font: bold,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  page.drawText(`${PDF_LABELS.INVOICE_NUMBER} ${data.invoiceNumber}`, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })

  page.drawText(`${PDF_LABELS.DATE} ${data.invoiceDate}`, {
    x: PAGE_WIDTH / 2,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })
  y -= LINE_HEIGHT

  // Due date
  const dueDate = data.dueDate || data.invoiceDate
  page.drawText(`${PDF_LABELS.DUE_DATE} ${dueDate}`, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })
  y -= 25

  // Bill To + Seller block side by side
  const billToY = y

  page.drawText(PDF_LABELS.BILL_TO, {
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

  page.drawText(`${PDF_LABELS.ORDER_NUMBER}${data.order.orderNumber}`, {
    x: MARGIN,
    y,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })
  y -= LINE_HEIGHT

  // Billing address
  if (data.order.billingAddress) {
    page.drawText(data.order.billingAddress, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  const billingCityLine = [data.order.billingPostalCode, data.order.billingCity]
    .filter(Boolean)
    .join(' ')
  if (billingCityLine) {
    page.drawText(billingCityLine, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  if (data.order.billingCountry) {
    page.drawText(data.order.billingCountry, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  y -= 15

  // Seller block (right side)
  if (data.seller) {
    drawSellerBlock(page, data.seller, fonts, billToY)
  }

  // Table header
  const tableLeft = MARGIN
  const tableRight = PAGE_WIDTH - MARGIN
  const tableWidth = tableRight - tableLeft
  const descCol = tableLeft + 10
  const qtyCol = tableLeft + 220
  const unitCol = tableLeft + 300
  const amountCol = tableLeft + 410

  page.drawRectangle({
    x: tableLeft,
    y: y - 5,
    width: tableWidth,
    height: 25,
    color: rgb(0.95, 0.95, 0.95)
  })

  page.drawText(PDF_LABELS.DESCRIPTION, {
    x: descCol,
    y: y + 2,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText(PDF_LABELS.QTY, { x: qtyCol, y: y + 2, size: 10, font: bold, color: TEXT_COLOR })
  page.drawText(PDF_LABELS.UNIT_PRICE, {
    x: unitCol,
    y: y + 2,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText(PDF_LABELS.AMOUNT, {
    x: amountCol,
    y: y + 2,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  y -= 30

  // Table rows
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
    page.drawText(
      formatPrice(
        vatRate > 0 ? Math.round(item.unitPrice / (1 + vatRate / 100)) : item.unitPrice,
        data.order.currency
      ),
      {
        x: unitCol,
        y,
        size: 10,
        font: regular,
        color: TEXT_COLOR
      }
    )
    page.drawText(formatPrice(itemHt, data.order.currency), {
      x: amountCol,
      y,
      size: 10,
      font: regular,
      color: TEXT_COLOR
    })

    totalCentsHt += itemHt
    y -= LINE_HEIGHT
  }

  // Separator line
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
  const summaryLabelX = tableLeft + 210
  page.drawText(PDF_LABELS.SUBTOTAL_HT, {
    x: summaryLabelX,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(formatPrice(totalCentsHt, data.order.currency), {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  // VAT line
  page.drawText(PDF_LABELS.VAT(vatRate), {
    x: summaryLabelX,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(formatPrice(vatCents, data.order.currency), {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT + 5

  // Separator before total
  page.drawRectangle({
    x: summaryLabelX,
    y: y + 3,
    width: PAGE_WIDTH - MARGIN - summaryLabelX,
    height: 1,
    color: rgb(0.7, 0.7, 0.7)
  })

  // Total TTC
  page.drawText(PDF_LABELS.TOTAL_TTC, {
    x: summaryLabelX,
    y: y - 2,
    size: 12,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText(formatPrice(totalCents, data.order.currency), {
    x: amountCol,
    y: y - 2,
    size: 12,
    font: bold,
    color: PRIMARY_COLOR
  })
  y -= 40

  // Status
  page.drawText(PDF_LABELS.STATUS_PAID, {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: rgb(22 / 255, 163 / 255, 106 / 255)
  })
  y -= 30

  // Legal mentions
  drawLegalMentions(page, vatRate, fonts, y)

  // Footer
  page.drawText(PDF_LABELS.THANK_PURCHASE, {
    x: MARGIN,
    y: MARGIN + 10,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })

  return pdfDoc.save()
}
