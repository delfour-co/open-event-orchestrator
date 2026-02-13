import { describe, expect, it } from 'vitest'
import type { Ticket, TicketTemplate, TicketType } from '../domain'
import {
  type TicketPdfData,
  generateMultipleTicketsPdf,
  generateTicketPdf
} from './pdf-ticket-service'

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  orderId: 'order-1',
  ticketTypeId: 'type-1',
  editionId: 'edition-1',
  attendeeEmail: 'test@example.com',
  attendeeFirstName: 'John',
  attendeeLastName: 'Doe',
  ticketNumber: 'TKT-ABC123',
  status: 'valid',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockTicketType = (overrides: Partial<TicketType> = {}): TicketType => ({
  id: 'type-1',
  editionId: 'edition-1',
  name: 'General Admission',
  description: 'Standard entry ticket',
  price: 5000,
  currency: 'EUR',
  quantity: 100,
  quantitySold: 10,
  isActive: true,
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockTemplate = (overrides: Partial<TicketTemplate> = {}): TicketTemplate => ({
  id: 'template-1',
  editionId: 'edition-1',
  primaryColor: '#3B82F6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  accentColor: '#10B981',
  showVenue: true,
  showDate: true,
  showQrCode: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockPdfData = (overrides: Partial<TicketPdfData> = {}): TicketPdfData => ({
  ticket: createMockTicket(),
  ticketType: createMockTicketType(),
  template: createMockTemplate(),
  eventName: 'Tech Conference',
  editionName: '2024 Edition',
  venue: 'Convention Center',
  startDate: new Date('2024-06-15'),
  ...overrides
})

describe('pdf-ticket-service', () => {
  describe('generateTicketPdf', () => {
    it('should generate a PDF with valid ticket data', async () => {
      const data = createMockPdfData()
      const pdfBytes = await generateTicketPdf(data)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
      expect(pdfBytes[0]).toBe(0x25)
      expect(pdfBytes[1]).toBe(0x50)
      expect(pdfBytes[2]).toBe(0x44)
      expect(pdfBytes[3]).toBe(0x46)
    })

    it('should generate PDF without venue when showVenue is false', async () => {
      const data = createMockPdfData({
        template: createMockTemplate({ showVenue: false })
      })
      const pdfBytes = await generateTicketPdf(data)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })

    it('should generate PDF without date when showDate is false', async () => {
      const data = createMockPdfData({
        template: createMockTemplate({ showDate: false })
      })
      const pdfBytes = await generateTicketPdf(data)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })

    it('should generate PDF with custom footer text', async () => {
      const data = createMockPdfData({
        template: createMockTemplate({ customFooterText: 'Please arrive 30 minutes early' })
      })
      const pdfBytes = await generateTicketPdf(data)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })

    it('should generate PDF with custom colors', async () => {
      const data = createMockPdfData({
        template: createMockTemplate({
          primaryColor: '#FF5733',
          backgroundColor: '#F0F0F0',
          textColor: '#333333',
          accentColor: '#00FF00'
        })
      })
      const pdfBytes = await generateTicketPdf(data)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })

    it('should generate PDF with custom dimensions', async () => {
      const data = createMockPdfData()
      const pdfBytes = await generateTicketPdf(data, { width: 400, height: 200 })

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })
  })

  describe('generateMultipleTicketsPdf', () => {
    it('should generate PDF with multiple tickets', async () => {
      const ticketsData = [
        createMockPdfData({
          ticket: createMockTicket({ id: 'ticket-1', ticketNumber: 'TKT-001' })
        }),
        createMockPdfData({
          ticket: createMockTicket({ id: 'ticket-2', ticketNumber: 'TKT-002' })
        }),
        createMockPdfData({ ticket: createMockTicket({ id: 'ticket-3', ticketNumber: 'TKT-003' }) })
      ]

      const pdfBytes = await generateMultipleTicketsPdf(ticketsData)

      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    })

    it('should throw error for empty tickets array', async () => {
      await expect(generateMultipleTicketsPdf([])).rejects.toThrow('No tickets to generate')
    })
  })
})
