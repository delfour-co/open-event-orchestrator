import {
  LINE_HEIGHT,
  MARGIN,
  MUTED_COLOR,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  PDF_LABELS,
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
  page.drawText(PDF_LABELS.CREDIT_NOTE_TITLE, {
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
  page.drawText(`${PDF_LABELS.DATE} ${data.creditNoteDate}`, {
    x: PAGE_WIDTH / 2,
    y,
    size: 10,
    font: regular,
    color: MUTED_COLOR
  })
  y -= LINE_HEIGHT

  // Reference to original invoice
  page.drawText(
    `${PDF_LABELS.CANCELS_INVOICE}${data.originalInvoiceNumber} ${PDF_LABELS.DATED} ${data.originalInvoiceDate}`,
    { x: MARGIN, y, size: 10, font: bold, color: TEXT_COLOR }
  )
  y -= 30

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
  page.drawText(PDF_LABELS.AMOUNT, {
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
  const summaryLabelX = tableLeft + 210
  page.drawText(PDF_LABELS.SUBTOTAL_HT, {
    x: summaryLabelX,
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
  page.drawText(PDF_LABELS.VAT(vatRate), {
    x: summaryLabelX,
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
    x: summaryLabelX,
    y: y + 3,
    width: PAGE_WIDTH - MARGIN - summaryLabelX,
    height: 1,
    color: rgb(0.7, 0.7, 0.7)
  })

  // Net to deduct (TTC)
  page.drawText(PDF_LABELS.NET_TO_DEDUCT, {
    x: summaryLabelX,
    y: y - 2,
    size: 12,
    font: bold,
    color: TEXT_COLOR
  })
  page.drawText(`-${formatCurrencyAmount(totalAmount, data.currency)}`, {
    x: amountCol,
    y: y - 2,
    size: 12,
    font: bold,
    color: REFUND_COLOR
  })
  y -= 40

  // Status
  page.drawText(PDF_LABELS.STATUS_REFUNDED, {
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
  page.drawText(PDF_LABELS.CREDIT_NOTE_FOOTER, {
    x: MARGIN,
    y: MARGIN + 10,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })

  return pdfDoc.save()
}
