import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createExportContactsUseCase } from './export-contacts'

const createMockPb = () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase collections
  const collections: Record<string, any> = {}
  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = {
          getList: vi.fn(),
          getFullList: vi.fn(),
          getOne: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        }
      }
      return collections[name]
    })
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase client
  } as any
}

describe('createExportContactsUseCase', () => {
  let pb: ReturnType<typeof createMockPb>
  let exportContacts: ReturnType<typeof createExportContactsUseCase>

  beforeEach(() => {
    pb = createMockPb()
    exportContacts = createExportContactsUseCase(pb)
  })

  it('exports CSV with default fields', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        company: 'Acme',
        jobTitle: 'Dev',
        phone: '+33600000000',
        city: 'Paris',
        country: 'France',
        source: 'manual',
        tags: ['vip']
      }
    ])

    const csv = await exportContacts('event1')

    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      'email,firstName,lastName,company,jobTitle,phone,city,country,source,tags'
    )
    expect(lines[1]).toBe(
      'alice@example.com,Alice,Martin,Acme,Dev,+33600000000,Paris,France,manual,"vip"'
    )
  })

  it('exports CSV with custom field selection', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Dupont'
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'firstName'] })

    const lines = csv.split('\n')
    expect(lines[0]).toBe('email,firstName')
    expect(lines[1]).toBe('bob@example.com,Bob')
  })

  it('handles empty contacts', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([])

    const csv = await exportContacts('event1')

    const lines = csv.split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe(
      'email,firstName,lastName,company,jobTitle,phone,city,country,source,tags'
    )
  })

  it('handles values with commas by wrapping in quotes', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        company: 'Acme, Inc.'
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'company'] })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('alice@example.com,"Acme, Inc."')
  })

  it('handles values with double quotes by escaping with ""', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        company: 'The "Best" Corp'
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'company'] })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('alice@example.com,"The ""Best"" Corp"')
  })

  it('handles values with newlines', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        company: 'Line1\nLine2'
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'company'] })

    // The field with newline is wrapped in quotes, so the raw CSV will have an embedded newline
    expect(csv).toContain('"Line1\nLine2"')
  })

  it('handles array values (tags) by joining with comma in quotes', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        tags: ['speaker', 'vip', 'sponsor']
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'tags'] })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('alice@example.com,"speaker, vip, sponsor"')
  })

  it('handles null/undefined values as empty string', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        email: 'alice@example.com',
        firstName: null,
        lastName: undefined
      }
    ])

    const csv = await exportContacts('event1', { fields: ['email', 'firstName', 'lastName'] })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('alice@example.com,,')
  })

  it('applies segment filter when provided', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([])

    await exportContacts('event1', { segmentFilter: 'source = "speaker"' })

    expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
      filter: 'eventId = "event1" && (source = "speaker")',
      sort: 'lastName,firstName'
    })
  })

  it('sorts by lastName, firstName', async () => {
    pb.collection('contacts').getFullList.mockResolvedValue([])

    await exportContacts('event1')

    expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith({
      filter: 'eventId = "event1"',
      sort: 'lastName,firstName'
    })
  })
})
