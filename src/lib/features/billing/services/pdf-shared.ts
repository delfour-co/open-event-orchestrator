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

export interface SellerInfo {
  name: string
  legalName?: string
  siret?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  contactEmail?: string
}

export const formatPrice = (cents: number, currency: string): string => {
  const value = cents / 100
  const symbols: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3' }
  const symbol = symbols[currency.toUpperCase()] || currency
  return `${value.toFixed(2)} ${symbol}`
}

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

  page.drawText('Issued by:', {
    x,
    y: currentY,
    size: 11,
    font: fonts.bold,
    color: TEXT_COLOR
  })
  currentY -= LINE_HEIGHT

  page.drawText(seller.legalName || seller.name, {
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
    page.drawText('TVA non applicable, art. 293 B du CGI', {
      x: MARGIN,
      y: currentY,
      size: 8,
      font: fonts.regular,
      color: TEXT_COLOR
    })
    currentY -= LINE_HEIGHT
  }

  currentY -= 5
  page.drawText('Conditions de paiement : Paiement comptant \u00E0 r\u00E9ception.', {
    x: MARGIN,
    y: currentY,
    size: 7,
    font: fonts.regular,
    color: MUTED_COLOR
  })
  currentY -= 12

  page.drawText(
    'En cas de retard de paiement, une p\u00E9nalit\u00E9 de 3 fois le taux d\u2019int\u00E9r\u00EAt l\u00E9gal sera appliqu\u00E9e,',
    { x: MARGIN, y: currentY, size: 7, font: fonts.regular, color: MUTED_COLOR }
  )
  currentY -= 12

  page.drawText('ainsi qu\u2019une indemnit\u00E9 forfaitaire de recouvrement de 40 \u20AC.', {
    x: MARGIN,
    y: currentY,
    size: 7,
    font: fonts.regular,
    color: MUTED_COLOR
  })
  currentY -= LINE_HEIGHT

  return currentY
}
