import type { PDFFont, PDFPage } from 'pdf-lib'
import { rgb } from 'pdf-lib'

export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89
export const MARGIN = 50
export const LINE_HEIGHT = 18
export const PRIMARY_COLOR = rgb(37 / 255, 99 / 255, 235 / 255)
export const REFUND_COLOR = rgb(220 / 255, 38 / 255, 38 / 255)
export const TEXT_COLOR = rgb(0.2, 0.2, 0.2)
export const MUTED_COLOR = rgb(0.5, 0.5, 0.5)

export const PDF_LABELS = {
  INVOICE_TITLE: 'FACTURE / INVOICE',
  CREDIT_NOTE_TITLE: 'AVOIR / CREDIT NOTE',
  BILL_TO: 'Factur\u00E9 \u00E0 / Bill To:',
  ISSUED_BY: '\u00C9mis par / Issued by:',
  DESCRIPTION: 'Description',
  QTY: 'Qt\u00E9 / Qty',
  UNIT_PRICE: 'Prix unit. HT / Unit Price',
  AMOUNT: 'Montant / Amount',
  SUBTOTAL_HT: 'Sous-total HT / Subtotal:',
  VAT: (rate: number): string =>
    rate > 0 ? `TVA / VAT (${rate}%):` : 'TVA / VAT (exon\u00E9r\u00E9e / exempt):',
  TOTAL_TTC: 'Total TTC / Total:',
  NET_TO_DEDUCT: 'Net \u00E0 d\u00E9duire TTC / Net to deduct:',
  STATUS_PAID: 'Statut / Status: PAY\u00C9 / PAID',
  STATUS_REFUNDED: 'Statut / Status: REMBOURS\u00C9 / REFUNDED',
  INVOICE_NUMBER: 'Facture n\u00B0 / Invoice #:',
  DATE: 'Date :',
  DUE_DATE: '\u00C9ch\u00E9ance / Due:',
  ORDER_NUMBER: 'Commande n\u00B0 / Order #',
  CANCELS_INVOICE: 'Annule la facture / Cancels invoice #',
  DATED: 'du / dated',
  THANK_PURCHASE: 'Merci pour votre achat ! / Thank you for your purchase!',
  THANK_SPONSORSHIP: 'Merci pour votre sponsoring ! / Thank you for your sponsorship!',
  CREDIT_NOTE_FOOTER:
    'Cet avoir annule et remplace la facture r\u00E9f\u00E9renc\u00E9e. / This credit note cancels and replaces the referenced invoice.'
} as const

export interface SellerInfo {
  name: string
  legalName?: string
  legalForm?: string
  rcsNumber?: string
  shareCapital?: string
  siret?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  contactEmail?: string
}

/**
 * Formats a price from cents to a display string.
 * @param cents - The price in cents (e.g. 1500 = 15.00)
 * @param currency - The ISO 4217 currency code (e.g. 'EUR', 'USD')
 */
export const formatPrice = (cents: number, currency: string): string => {
  const value = cents / 100
  const symbols: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3' }
  const symbol = symbols[currency.toUpperCase()] || currency
  return `${value.toFixed(2)} ${symbol}`
}

/**
 * Formats a decimal currency amount to a display string.
 * @param amount - The price as a decimal number (e.g. 15.00)
 * @param currency - The ISO 4217 currency code (e.g. 'EUR', 'USD')
 */
export const formatCurrencyAmount = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3' }
  const symbol = symbols[currency.toUpperCase()] || currency
  return `${amount.toFixed(2)} ${symbol}`
}

export interface PdfFonts {
  bold: PDFFont
  regular: PDFFont
}

export const drawSellerBlock = (
  page: PDFPage,
  seller: SellerInfo,
  fonts: PdfFonts,
  startY: number
): number => {
  let currentY = startY
  const x = PAGE_WIDTH / 2

  page.drawText(PDF_LABELS.ISSUED_BY, {
    x,
    y: currentY,
    size: 11,
    font: fonts.bold,
    color: TEXT_COLOR
  })
  currentY -= LINE_HEIGHT

  // Legal name with legal form (e.g. "ACME SAS")
  const displayName = seller.legalName || seller.name
  const nameWithForm = seller.legalForm ? `${displayName} - ${seller.legalForm}` : displayName
  page.drawText(nameWithForm, {
    x,
    y: currentY,
    size: 10,
    font: fonts.bold,
    color: TEXT_COLOR
  })
  currentY -= LINE_HEIGHT

  if (seller.siret) {
    page.drawText(`SIRET: ${seller.siret}`, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.rcsNumber) {
    page.drawText(`RCS: ${seller.rcsNumber}`, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.shareCapital) {
    page.drawText(`Capital social : ${seller.shareCapital}`, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.vatNumber) {
    page.drawText(`TVA: ${seller.vatNumber}`, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.address) {
    page.drawText(seller.address, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  const cityLine = [seller.postalCode, seller.city].filter(Boolean).join(' ')
  if (cityLine) {
    page.drawText(cityLine, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.country) {
    page.drawText(seller.country, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  if (seller.contactEmail) {
    page.drawText(seller.contactEmail, {
      x,
      y: currentY,
      size: 9,
      font: fonts.regular,
      color: MUTED_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  return currentY
}

export const drawLegalMentions = (
  page: PDFPage,
  vatRate: number,
  fonts: PdfFonts,
  startY: number
): number => {
  let currentY = startY

  if (vatRate === 0) {
    page.drawText('TVA non applicable, art. 293 B du CGI / VAT not applicable, art. 293 B CGI', {
      x: MARGIN,
      y: currentY,
      size: 8,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  currentY -= 5
  page.drawText(
    'Pas d\u2019escompte pour paiement anticip\u00E9. / No discount for early payment.',
    {
      x: MARGIN,
      y: currentY,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR
    }
  )
  currentY -= 12

  page.drawText(
    'Conditions de paiement : Paiement comptant \u00E0 r\u00E9ception. / Payment terms: Due on receipt.',
    {
      x: MARGIN,
      y: currentY,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR
    }
  )
  currentY -= 12

  page.drawText(
    'En cas de retard de paiement, une p\u00E9nalit\u00E9 de 3 fois le taux d\u2019int\u00E9r\u00EAt l\u00E9gal sera appliqu\u00E9e,',
    { x: MARGIN, y: currentY, size: 7, font: fonts.regular, color: MUTED_COLOR }
  )
  currentY -= 12

  page.drawText(
    'ainsi qu\u2019une indemnit\u00E9 forfaitaire de recouvrement de 40 \u20AC. / plus a fixed recovery fee of \u20AC40.',
    {
      x: MARGIN,
      y: currentY,
      size: 7,
      font: fonts.regular,
      color: MUTED_COLOR
    }
  )
  currentY -= LINE_HEIGHT

  return currentY
}
