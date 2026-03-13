import { describe, expect, it } from 'vitest'
import { parseQrCodeData } from './contacts-service'

describe('parseQrCodeData', () => {
  const editionSlug = 'test-edition-2026'

  it('parses JSON contact data', () => {
    const json = JSON.stringify({
      firstName: 'Alice',
      lastName: 'Dupont',
      email: 'alice@example.com',
      company: 'Acme Corp',
      title: 'CTO',
      phone: '+33612345678'
    })

    const result = parseQrCodeData(json, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('contact')
    if (result?.type === 'contact') {
      expect(result.contact.firstName).toBe('Alice')
      expect(result.contact.lastName).toBe('Dupont')
      expect(result.contact.email).toBe('alice@example.com')
      expect(result.contact.company).toBe('Acme Corp')
      expect(result.contact.title).toBe('CTO')
      expect(result.contact.phone).toBe('+33612345678')
      expect(result.contact.editionSlug).toBe(editionSlug)
    }
  })

  it('parses JSON with minimal fields', () => {
    const json = JSON.stringify({ firstName: 'Bob', email: 'bob@test.com' })

    const result = parseQrCodeData(json, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('contact')
    if (result?.type === 'contact') {
      expect(result.contact.firstName).toBe('Bob')
      expect(result.contact.lastName).toBe('')
      expect(result.contact.email).toBe('bob@test.com')
      expect(result.contact.company).toBeUndefined()
    }
  })

  it('parses ticket QR code', () => {
    const json = JSON.stringify({
      ticketId: 'TKT-123',
      ticketNumber: 'TKT-123',
      editionId: 'ed-1'
    })

    const result = parseQrCodeData(json, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('ticket')
    if (result?.type === 'ticket') {
      expect(result.ticketNumber).toBe('TKT-123')
    }
  })

  it('parses ticket QR code with only ticketId', () => {
    const json = JSON.stringify({ ticketId: 'TKT-456' })

    const result = parseQrCodeData(json, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('ticket')
    if (result?.type === 'ticket') {
      expect(result.ticketNumber).toBe('TKT-456')
    }
  })

  it('parses vCard 3.0 format', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Martin;Claire;;;',
      'FN:Claire Martin',
      'EMAIL:claire@example.com',
      'ORG:TechCo',
      'TITLE:Engineer',
      'TEL:+33698765432',
      'END:VCARD'
    ].join('\r\n')

    const result = parseQrCodeData(vcard, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.type).toBe('contact')
    if (result?.type === 'contact') {
      expect(result.contact.firstName).toBe('Claire')
      expect(result.contact.lastName).toBe('Martin')
      expect(result.contact.email).toBe('claire@example.com')
      expect(result.contact.company).toBe('TechCo')
      expect(result.contact.title).toBe('Engineer')
      expect(result.contact.phone).toBe('+33698765432')
      expect(result.contact.editionSlug).toBe(editionSlug)
    }
  })

  it('handles vCard with EMAIL;TYPE= format', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Smith;John;;;',
      'FN:John Smith',
      'EMAIL;TYPE=INTERNET:john@example.com',
      'END:VCARD'
    ].join('\r\n')

    const result = parseQrCodeData(vcard, editionSlug)

    expect(result).not.toBeNull()
    if (result?.type === 'contact') {
      expect(result.contact.email).toBe('john@example.com')
    }
  })

  it('returns null for unrecognized format', () => {
    const result = parseQrCodeData('random-string-123', editionSlug)
    expect(result).toBeNull()
  })

  it('handles vCard with escaped characters', () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      "N:O\\'Brien;Sean;;;",
      "FN:Sean O\\'Brien",
      'EMAIL:sean@example.com',
      'ORG:Tech\\, Inc.',
      'END:VCARD'
    ].join('\r\n')

    const result = parseQrCodeData(vcard, editionSlug)

    expect(result).not.toBeNull()
    if (result?.type === 'contact') {
      expect(result.contact.email).toBe('sean@example.com')
    }
  })
})
