import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Ticket, TicketTemplate, TicketType } from '../domain'
import { hexToRgb } from '../domain/ticket-template'

export interface TicketPdfData {
  ticket: Ticket
  ticketType: TicketType
  template: TicketTemplate
  eventName: string
  editionName: string
  venue?: string
  startDate?: Date
  logoDataUrl?: string
}

export interface GeneratePdfOptions {
  width?: number
  height?: number
}

const DEFAULT_WIDTH = 595.28
const DEFAULT_HEIGHT = 280

export const generateTicketPdf = async (
  data: TicketPdfData,
  options: GeneratePdfOptions = {}
): Promise<Uint8Array> => {
  const { ticket, ticketType, template, eventName, editionName, venue, startDate, logoDataUrl } =
    data
  const width = options.width || DEFAULT_WIDTH
  const height = options.height || DEFAULT_HEIGHT

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([width, height])

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const bgColor = hexToRgb(template.backgroundColor)
  const primaryColor = hexToRgb(template.primaryColor)
  const textColor = hexToRgb(template.textColor)
  const accentColor = hexToRgb(template.accentColor)

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255)
  })

  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(primaryColor.r / 255, primaryColor.g / 255, primaryColor.b / 255)
  })

  let headerTextStartX = 20

  if (logoDataUrl?.startsWith('data:image/png')) {
    try {
      const base64Data = logoDataUrl.split(',')[1]
      const logoBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
      const logoImage = await pdfDoc.embedPng(logoBytes)
      const logoDims = logoImage.scale(0.3)
      const logoHeight = Math.min(logoDims.height, 40)
      const logoWidth = (logoDims.width / logoDims.height) * logoHeight

      page.drawImage(logoImage, {
        x: 20,
        y: height - 50,
        width: logoWidth,
        height: logoHeight
      })
      headerTextStartX = 20 + logoWidth + 15
    } catch {
      // Continue without logo if embedding fails
    }
  }

  page.drawText(eventName, {
    x: headerTextStartX,
    y: height - 35,
    size: 18,
    font: helveticaBold,
    color: rgb(1, 1, 1)
  })

  page.drawText(editionName, {
    x: headerTextStartX,
    y: height - 52,
    size: 12,
    font: helvetica,
    color: rgb(1, 1, 1)
  })

  page.drawText(ticketType.name, {
    x: 20,
    y: height - 90,
    size: 16,
    font: helveticaBold,
    color: rgb(primaryColor.r / 255, primaryColor.g / 255, primaryColor.b / 255)
  })

  page.drawText(`${ticket.attendeeFirstName} ${ticket.attendeeLastName}`, {
    x: 20,
    y: height - 115,
    size: 14,
    font: helveticaBold,
    color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
  })

  page.drawText(ticket.attendeeEmail, {
    x: 20,
    y: height - 132,
    size: 10,
    font: helvetica,
    color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
  })

  let yPosition = height - 160

  if (template.showDate && startDate) {
    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    page.drawText(`Date: ${dateStr}`, {
      x: 20,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
    })
    yPosition -= 18
  }

  if (template.showVenue && venue) {
    page.drawText(`Venue: ${venue}`, {
      x: 20,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
    })
    yPosition -= 18
  }

  page.drawText(`Ticket #${ticket.ticketNumber}`, {
    x: 20,
    y: 40,
    size: 10,
    font: helvetica,
    color: rgb(accentColor.r / 255, accentColor.g / 255, accentColor.b / 255)
  })

  if (template.customFooterText) {
    page.drawText(template.customFooterText, {
      x: 20,
      y: 20,
      size: 8,
      font: helvetica,
      color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
    })
  }

  if (template.showQrCode && ticket.qrCode) {
    try {
      const qrBase64 = ticket.qrCode.split(',')[1]
      const qrBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0))
      const qrImage = await pdfDoc.embedPng(qrBytes)

      const qrSize = 120
      page.drawImage(qrImage, {
        x: width - qrSize - 20,
        y: height - 190,
        width: qrSize,
        height: qrSize
      })

      page.drawText('Scan to check in', {
        x: width - qrSize - 10,
        y: height - 205,
        size: 8,
        font: helvetica,
        color: rgb(textColor.r / 255, textColor.g / 255, textColor.b / 255)
      })
    } catch {
      // Continue without QR if embedding fails
    }
  }

  return pdfDoc.save()
}

export const generateMultipleTicketsPdf = async (
  ticketsData: TicketPdfData[]
): Promise<Uint8Array> => {
  if (ticketsData.length === 0) {
    throw new Error('No tickets to generate')
  }

  const pdfDoc = await PDFDocument.create()

  for (const data of ticketsData) {
    const ticketPdfBytes = await generateTicketPdf(data)
    const ticketPdfDoc = await PDFDocument.load(ticketPdfBytes)
    const [copiedPage] = await pdfDoc.copyPages(ticketPdfDoc, [0])
    pdfDoc.addPage(copiedPage)
  }

  return pdfDoc.save()
}
