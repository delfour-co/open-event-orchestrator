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
    expect(result?.firstName).toBe('Alice')
    expect(result?.lastName).toBe('Dupont')
    expect(result?.email).toBe('alice@example.com')
    expect(result?.company).toBe('Acme Corp')
    expect(result?.title).toBe('CTO')
    expect(result?.phone).toBe('+33612345678')
    expect(result?.editionSlug).toBe(editionSlug)
  })

  it('parses JSON with minimal fields', () => {
    const json = JSON.stringify({ firstName: 'Bob', email: 'bob@test.com' })

    const result = parseQrCodeData(json, editionSlug)

    expect(result).not.toBeNull()
    expect(result?.firstName).toBe('Bob')
    expect(result?.lastName).toBe('')
    expect(result?.email).toBe('bob@test.com')
    expect(result?.company).toBeUndefined()
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
    expect(result?.firstName).toBe('Claire')
    expect(result?.lastName).toBe('Martin')
    expect(result?.email).toBe('claire@example.com')
    expect(result?.company).toBe('TechCo')
    expect(result?.title).toBe('Engineer')
    expect(result?.phone).toBe('+33698765432')
    expect(result?.editionSlug).toBe(editionSlug)
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
    expect(result?.email).toBe('john@example.com')
  })

  it('returns null for unrecognized format', () => {
    const result = parseQrCodeData('random-string-123', editionSlug)
    expect(result).toBeNull()
  })

  it('returns null for JSON without contact fields', () => {
    const json = JSON.stringify({ ticketNumber: 'T-123', orderId: 'O-456' })

    const result = parseQrCodeData(json, editionSlug)
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
    expect(result?.email).toBe('sean@example.com')
  })
})
