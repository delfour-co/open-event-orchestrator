import { describe, expect, it } from 'vitest'
import { PDF_LABELS, formatCurrencyAmount, formatPrice } from './pdf-shared'

describe('pdf-shared', () => {
  describe('formatPrice', () => {
    it('should format EUR cents correctly', () => {
      expect(formatPrice(1500, 'EUR')).toBe('15.00 €')
    })

    it('should format zero correctly', () => {
      expect(formatPrice(0, 'EUR')).toBe('0.00 €')
    })

    it('should format USD cents correctly', () => {
      expect(formatPrice(9999, 'USD')).toBe('99.99 $')
    })

    it('should format GBP cents correctly', () => {
      expect(formatPrice(2500, 'GBP')).toBe('25.00 £')
    })

    it('should use currency code for unknown currencies', () => {
      expect(formatPrice(5000, 'JPY')).toBe('50.00 JPY')
    })

    it('should handle case-insensitive currency', () => {
      expect(formatPrice(1000, 'eur')).toBe('10.00 €')
    })
  })

  describe('formatCurrencyAmount', () => {
    it('should format decimal EUR amount', () => {
      expect(formatCurrencyAmount(15.0, 'EUR')).toBe('15.00 €')
    })

    it('should format zero correctly', () => {
      expect(formatCurrencyAmount(0, 'EUR')).toBe('0.00 €')
    })

    it('should format USD amount', () => {
      expect(formatCurrencyAmount(99.99, 'USD')).toBe('99.99 $')
    })

    it('should use currency code for unknown currencies', () => {
      expect(formatCurrencyAmount(50, 'CHF')).toBe('50.00 CHF')
    })
  })

  describe('PDF_LABELS', () => {
    it('should have bilingual invoice title', () => {
      expect(PDF_LABELS.INVOICE_TITLE).toContain('FACTURE')
      expect(PDF_LABELS.INVOICE_TITLE).toContain('INVOICE')
    })

    it('should have bilingual credit note title', () => {
      expect(PDF_LABELS.CREDIT_NOTE_TITLE).toContain('AVOIR')
      expect(PDF_LABELS.CREDIT_NOTE_TITLE).toContain('CREDIT NOTE')
    })

    it('should generate VAT label with rate', () => {
      expect(PDF_LABELS.VAT(20)).toContain('20%')
      expect(PDF_LABELS.VAT(20)).toContain('TVA')
      expect(PDF_LABELS.VAT(20)).toContain('VAT')
    })

    it('should generate exempt VAT label for 0%', () => {
      expect(PDF_LABELS.VAT(0)).toContain('exonérée')
      expect(PDF_LABELS.VAT(0)).toContain('exempt')
    })

    it('should have bilingual bill to label', () => {
      expect(PDF_LABELS.BILL_TO).toContain('Facturé à')
      expect(PDF_LABELS.BILL_TO).toContain('Bill To')
    })

    it('should have bilingual due date label', () => {
      expect(PDF_LABELS.DUE_DATE).toContain('Échéance')
      expect(PDF_LABELS.DUE_DATE).toContain('Due')
    })
  })
})
