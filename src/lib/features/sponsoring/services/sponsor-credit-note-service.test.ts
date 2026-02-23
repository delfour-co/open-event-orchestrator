import { describe, expect, it } from 'vitest'
import { generateSponsorCreditNotePdf } from './sponsor-credit-note-service'

describe('sponsor-credit-note-service', () => {
  it('should generate a valid credit note PDF', async () => {
    const pdfBytes = await generateSponsorCreditNotePdf({
      creditNoteNumber: 'CN-SPO-001',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-SPO-001',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      sponsorName: 'Acme Corp',
      packageName: 'Gold',
      amount: 5000,
      currency: 'EUR',
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with seller info', async () => {
    const pdfBytes = await generateSponsorCreditNotePdf({
      creditNoteNumber: 'CN-SPO-002',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-SPO-002',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      sponsorName: 'Big Corp',
      legalName: 'Big Corp SAS',
      vatNumber: 'FR12345678901',
      packageName: 'Platinum',
      amount: 10000,
      currency: 'EUR',
      vatRate: 20,
      seller: {
        name: 'Event Org',
        legalName: 'Event Org SAS',
        siret: '987 654 321 00010'
      }
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with zero VAT', async () => {
    const pdfBytes = await generateSponsorCreditNotePdf({
      creditNoteNumber: 'CN-SPO-003',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-SPO-003',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Free Event',
      sponsorName: 'Small Co',
      packageName: 'Silver',
      amount: 1000,
      currency: 'EUR',
      vatRate: 0
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with billing address', async () => {
    const pdfBytes = await generateSponsorCreditNotePdf({
      creditNoteNumber: 'CN-SPO-004',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-SPO-004',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Conference',
      sponsorName: 'Corp Inc',
      billingAddress: '10 avenue des Champs',
      billingCity: 'Paris',
      billingPostalCode: '75008',
      billingCountry: 'France',
      packageName: 'Bronze',
      amount: 2000,
      currency: 'EUR',
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })
})
