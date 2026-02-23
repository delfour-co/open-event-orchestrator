import { describe, expect, it } from 'vitest'
import {
  type SponsorInvoiceData,
  formatCurrencyAmount,
  generateInvoiceNumber,
  generateSponsorInvoicePdf
} from './sponsor-invoice-service'

describe('sponsor-invoice-service', () => {
  const baseData: SponsorInvoiceData = {
    invoiceNumber: 'SPO-20260219-ABC123',
    invoiceDate: 'February 19, 2026',
    eventName: 'Tech Conference 2026',
    sponsorName: 'Acme Corp',
    legalName: 'Acme Corporation SAS',
    vatNumber: 'FR12345678901',
    siret: '123 456 789 00012',
    billingAddress: '42 Rue de la Paix',
    billingCity: 'Paris',
    billingPostalCode: '75002',
    billingCountry: 'France',
    packageName: 'Gold',
    amount: 5000,
    currency: 'EUR'
  }

  describe('generateSponsorInvoicePdf', () => {
    it('should return a non-empty Uint8Array', async () => {
      const result = await generateSponsorInvoicePdf(baseData)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should start with PDF magic bytes', async () => {
      const result = await generateSponsorInvoicePdf(baseData)

      const header = String.fromCharCode(...result.slice(0, 5))
      expect(header).toBe('%PDF-')
    })

    it('should generate PDF without optional billing fields', async () => {
      const minimalData: SponsorInvoiceData = {
        invoiceNumber: 'SPO-20260219-DEF456',
        invoiceDate: 'February 19, 2026',
        eventName: 'Minimal Event',
        sponsorName: 'Small Co',
        packageName: 'Bronze',
        amount: 100,
        currency: 'USD'
      }

      const result = await generateSponsorInvoicePdf(minimalData)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('generateInvoiceNumber', () => {
    it('should generate correct format', () => {
      const date = new Date(2026, 1, 19)
      const result = generateInvoiceNumber('abc123def456', date)

      expect(result).toBe('SPO-20260219-ABC123')
    })

    it('should zero-pad month and day', () => {
      const date = new Date(2026, 0, 5)
      const result = generateInvoiceNumber('xyz789', date)

      expect(result).toBe('SPO-20260105-XYZ789')
    })

    it('should uppercase the sponsor ID slice', () => {
      const result = generateInvoiceNumber('abcdef', new Date(2026, 5, 15))

      expect(result).toMatch(/^SPO-\d{8}-[A-Z0-9]{6}$/)
    })
  })

  describe('formatCurrencyAmount', () => {
    it('should format EUR amount', () => {
      expect(formatCurrencyAmount(5000, 'EUR')).toBe('5000.00 \u20AC')
    })

    it('should format USD amount', () => {
      expect(formatCurrencyAmount(99.99, 'USD')).toBe('99.99 $')
    })

    it('should format GBP amount', () => {
      expect(formatCurrencyAmount(250, 'GBP')).toBe('250.00 \u00A3')
    })

    it('should fallback to currency code for unknown currencies', () => {
      expect(formatCurrencyAmount(100, 'CHF')).toBe('100.00 CHF')
    })
  })
})
