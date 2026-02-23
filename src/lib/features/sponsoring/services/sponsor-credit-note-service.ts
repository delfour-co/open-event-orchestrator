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
  formatCurrencyAmount
} from '$lib/features/billing/services/pdf-shared'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface SponsorCreditNoteData {
  creditNoteNumber: string
  creditNoteDate: string
  originalInvoiceNumber: string
  originalInvoiceDate: string
  eventName: string
  sponsorName: string
  legalName?: string
  vatNumber?: string
  siret?: string
  billingAddress?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
  packageName: string
  amount: number
  currency: string
  vatRate: number
  seller?: SellerInfo
}

export const generateSponsorCreditNotePdf = async (
  data: SponsorCreditNoteData
): Promise<Uint8Array> => {
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

  // Bill To + Seller block side by side
  const billToY = y

  page.drawText('Bill To:', {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  const billTo = data.legalName || data.sponsorName
  page.drawText(billTo, {
    x: MARGIN,
    y,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  if (data.vatNumber) {
    page.drawText(`VAT: ${data.vatNumber}`, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  if (data.siret) {
    page.drawText(`SIRET: ${data.siret}`, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  if (data.billingAddress) {
    page.drawText(data.billingAddress, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  const cityLine = [data.billingPostalCode, data.billingCity].filter(Boolean).join(' ')
  if (cityLine) {
    page.drawText(cityLine, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  if (data.billingCountry) {
    page.drawText(data.billingCountry, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  y -= 20

  // Seller block (right side)
  if (data.seller) {
    drawSellerBlock(page, data.seller, fonts, billToY)
  }

  // Table header
  const tableLeft = MARGIN
  const tableRight = PAGE_WIDTH - MARGIN
  const tableWidth = tableRight - tableLeft
  const descCol = tableLeft + 10
  const amountCol = tableRight - 100

  page.drawRectangle({
    x: tableLeft,
    y: y - 5,
    width: tableWidth,
    height: 25,
    color: rgb(0.95, 0.95, 0.95)
  })

  page.drawText('Description', {
    x: descCol,
    y: y + 2,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText('Amount', {
    x: amountCol,
    y: y + 2,
    size: 10,
    font: bold,
    color: TEXT_COLOR
  })
  y -= 30

  const vatRate = data.vatRate ?? 0
  const totalAmount = data.amount
  const htAmount = vatRate > 0 ? Math.round(totalAmount / (1 + vatRate / 100)) : totalAmount
  const vatAmount = totalAmount - htAmount

  // Table row (negative amounts)
  page.drawText(`${data.packageName} Sponsorship`, {
    x: descCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatCurrencyAmount(htAmount, data.currency)}`, {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: REFUND_COLOR
  })
  y -= 15

  // Separator
  page.drawRectangle({
    x: tableLeft,
    y,
    width: tableWidth,
    height: 1,
    color: rgb(0.85, 0.85, 0.85)
  })
  y -= 20

  // Subtotal HT
  page.drawText('Subtotal (HT):', {
    x: amountCol - 80,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatCurrencyAmount(htAmount, data.currency)}`, {
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
  page.drawText(`-${formatCurrencyAmount(vatAmount, data.currency)}`, {
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
  page.drawText(`-${formatCurrencyAmount(totalAmount, data.currency)}`, {
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
