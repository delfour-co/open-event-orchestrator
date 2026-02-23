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
  formatCurrencyAmount
} from '$lib/features/billing/services/pdf-shared'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export { formatCurrencyAmount }

export interface SponsorInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  eventName: string
  sponsorName: string
  legalName?: string
  vatNumber?: string
  siret?: string
  billingAddress?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
  poNumber?: string
  packageName: string
  amount: number
  currency: string
  vatRate?: number
  seller?: SellerInfo
}

export const generateInvoiceNumber = (sponsorId: string, date: Date = new Date()): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `SPO-${y}${m}${d}-${sponsorId.slice(0, 6).toUpperCase()}`
}

export const generateSponsorInvoicePdf = async (data: SponsorInvoiceData): Promise<Uint8Array> => {
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

  // PO number
  if (data.poNumber) {
    page.drawText(`PO: ${data.poNumber}`, {
      x: PAGE_WIDTH / 2,
      y,
      size: 10,
      font: regular,
      color: MUTED_COLOR
    })
  }
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

  // Intracommunity reverse charge: if sponsor has VAT number and is in a different country
  const sellerCountry = data.seller?.country || 'France'
  const buyerCountry = data.billingCountry || ''
  const isReverseCharge =
    !!data.vatNumber && !!buyerCountry && buyerCountry.toLowerCase() !== sellerCountry.toLowerCase()

  const effectiveVatRate = isReverseCharge ? 0 : (data.vatRate ?? 0)
  const totalAmountCents = data.amount
  const htAmountCents =
    effectiveVatRate > 0
      ? Math.round(totalAmountCents / (1 + effectiveVatRate / 100))
      : totalAmountCents
  const vatAmountCents = totalAmountCents - htAmountCents

  const formattedHt = formatCurrencyAmount(htAmountCents, data.currency)
  const formattedVat = formatCurrencyAmount(vatAmountCents, data.currency)
  const formattedTotal = formatCurrencyAmount(totalAmountCents, data.currency)

  // Table row
  page.drawText(`${data.packageName} Sponsorship`, {
    x: descCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })

  page.drawText(formattedHt, {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })

  y -= 15

  // Separator line
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
  page.drawText(formattedHt, {
    x: amountCol,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  y -= LINE_HEIGHT

  // VAT line
  page.drawText(PDF_LABELS.VAT(effectiveVatRate), {
    x: summaryLabelX,
    y,
    size: 10,
    font: regular,
    color: TEXT_COLOR
  })
  page.drawText(formattedVat, {
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
  page.drawText(formattedTotal, {
    x: amountCol,
    y: y - 2,
    size: 12,
    font: bold,
    color: PRIMARY_COLOR
  })
  y -= 25

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

  // Reverse charge mention
  if (isReverseCharge) {
    page.drawText('Autoliquidation / Reverse charge, art. 283-2 du CGI', {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
      color: TEXT_COLOR
    })
    y -= LINE_HEIGHT
  }

  // Legal mentions
  drawLegalMentions(page, effectiveVatRate, fonts, y)

  // Footer
  page.drawText(PDF_LABELS.THANK_SPONSORSHIP, {
    x: MARGIN,
    y: MARGIN + 10,
    size: 9,
    font: regular,
    color: MUTED_COLOR
  })

  return pdfDoc.save()
}
