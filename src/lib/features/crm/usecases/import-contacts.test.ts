import { describe, expect, it, vi } from 'vitest'
import {
  type ImportContactRow,
  createImportContactsUseCase,
  parseCsvToRows
} from './import-contacts'

// ---------------------------------------------------------------------------
// PocketBase mock helper
// ---------------------------------------------------------------------------

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}
  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    })
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase client
  } as any
}

const createMockCollection = () => ({
  getList: vi.fn(),
  getFullList: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
})

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeRow = (overrides: Partial<ImportContactRow> = {}): ImportContactRow => ({
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
  company: 'Acme',
  jobTitle: 'Engineer',
  phone: '+33612345678',
  city: 'Paris',
  country: 'France',
  tags: '',
  ...overrides
})

const makeExistingContact = (overrides: Record<string, unknown> = {}) => ({
  id: 'contact-1',
  eventId: 'event-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
  company: 'Acme',
  jobTitle: 'Engineer',
  phone: '+33612345678',
  city: 'Paris',
  country: 'France',
  tags: [] as string[],
  source: 'manual',
  notes: '',
  ...overrides
})

const noMatch = () => ({ items: [], totalItems: 0, totalPages: 0, page: 1, perPage: 1 })

const oneMatch = (contact: ReturnType<typeof makeExistingContact>) => ({
  items: [contact],
  totalItems: 1,
  totalPages: 1,
  page: 1,
  perPage: 1
})

// ===========================================================================
// parseCsvToRows
// ===========================================================================

describe('parseCsvToRows', () => {
  describe('basic parsing (exercises parseCsvLine internally)', () => {
    it('should parse basic comma-separated values', () => {
      const csv = 'email,firstname,lastname\nalice@example.com,Alice,Martin'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('Martin')
    })

    it('should handle quoted values containing commas', () => {
      const csv = 'email,firstname,lastname,company\nalice@example.com,Alice,Martin,"Acme, Inc."'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].company).toBe('Acme, Inc.')
    })

    it('should handle empty values between commas', () => {
      const csv = 'email,firstname,lastname,company,jobtitle\nalice@example.com,Alice,Martin,,'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].company).toBe('')
      expect(rows[0].jobTitle).toBe('')
    })

    it('should handle mixed quoted and unquoted values', () => {
      const csv =
        'email,firstname,lastname,company,jobtitle\nalice@example.com,Alice,Martin,"Acme, Inc.",Engineer'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].company).toBe('Acme, Inc.')
      expect(rows[0].jobTitle).toBe('Engineer')
    })

    it('should parse multiple data rows', () => {
      const csv = [
        'email,firstname,lastname',
        'alice@example.com,Alice,Martin',
        'bob@example.com,Bob,Dupont'
      ].join('\n')
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(2)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[1].email).toBe('bob@example.com')
    })

    it('should trim whitespace around values', () => {
      const csv = 'email , firstname , lastname\n  alice@example.com , Alice , Martin  '
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('Martin')
    })
  })

  describe('header mapping', () => {
    it('should map standard English headers', () => {
      const csv =
        'email,firstname,lastname,company,jobtitle,phone,city,country,tags\nalice@example.com,Alice,Martin,Acme,Engineer,+33612345678,Paris,France,vip'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0]).toEqual({
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        company: 'Acme',
        jobTitle: 'Engineer',
        phone: '+33612345678',
        city: 'Paris',
        country: 'France',
        tags: 'vip'
      })
    })

    it('should map French headers (prenom, nom, entreprise, poste, telephone, ville, pays)', () => {
      const csv =
        'email,prenom,nom,entreprise,poste,telephone,ville,pays\nalice@example.com,Alice,Martin,Acme,Ingenieur,+33612345678,Paris,France'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('Martin')
      expect(rows[0].company).toBe('Acme')
      expect(rows[0].jobTitle).toBe('Ingenieur')
      expect(rows[0].phone).toBe('+33612345678')
      expect(rows[0].city).toBe('Paris')
      expect(rows[0].country).toBe('France')
    })

    it('should map alternate English headers with underscores (first_name, last_name, job_title)', () => {
      const csv =
        'email,first_name,last_name,company,job_title\nalice@example.com,Alice,Martin,Acme,Engineer'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('Martin')
      expect(rows[0].jobTitle).toBe('Engineer')
    })

    it('should be case-insensitive on headers', () => {
      const csv = 'Email,FirstName,LastName\nalice@example.com,Alice,Martin'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('Martin')
    })
  })

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      expect(parseCsvToRows('')).toEqual([])
    })

    it('should return empty array for header-only CSV', () => {
      expect(parseCsvToRows('email,firstname,lastname')).toEqual([])
    })

    it('should return empty array for whitespace-only input', () => {
      expect(parseCsvToRows('   ')).toEqual([])
    })

    it('should set missing optional fields to empty strings', () => {
      const csv = 'email,firstname,lastname\nalice@example.com,Alice,Martin'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].company).toBe('')
      expect(rows[0].jobTitle).toBe('')
      expect(rows[0].phone).toBe('')
      expect(rows[0].city).toBe('')
      expect(rows[0].country).toBe('')
      expect(rows[0].tags).toBe('')
    })

    it('should handle rows with fewer values than headers', () => {
      const csv = 'email,firstname,lastname,company\nalice@example.com,Alice'
      const rows = parseCsvToRows(csv)

      expect(rows).toHaveLength(1)
      expect(rows[0].email).toBe('alice@example.com')
      expect(rows[0].firstName).toBe('Alice')
      expect(rows[0].lastName).toBe('')
      expect(rows[0].company).toBe('')
    })
  })
})

// ===========================================================================
// createImportContactsUseCase
// ===========================================================================

describe('createImportContactsUseCase', () => {
  describe('creating new contacts', () => {
    it('should create a new contact when no duplicate exists', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [makeRow()])

      expect(result.total).toBe(1)
      expect(result.created).toBe(1)
      expect(result.updated).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])

      expect(pb.collection('contacts').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-1',
          email: 'alice@example.com',
          firstName: 'Alice',
          lastName: 'Martin',
          company: 'Acme',
          jobTitle: 'Engineer',
          phone: '+33612345678',
          city: 'Paris',
          country: 'France',
          source: 'import',
          notes: ''
        })
      )
    })

    it('should create multiple contacts in sequence', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [
        makeRow({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Martin' }),
        makeRow({ email: 'bob@example.com', firstName: 'Bob', lastName: 'Dupont' })
      ]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows)

      expect(result.total).toBe(2)
      expect(result.created).toBe(2)
      expect(pb.collection('contacts').create).toHaveBeenCalledTimes(2)
    })

    it('should set default empty strings for missing optional fields', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const row = makeRow({
        company: undefined,
        jobTitle: undefined,
        phone: undefined,
        city: undefined,
        country: undefined
      })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row])

      expect(pb.collection('contacts').create).toHaveBeenCalledWith(
        expect.objectContaining({
          company: '',
          jobTitle: '',
          phone: '',
          city: '',
          country: ''
        })
      )
    })

    it('should parse and store tags as JSON array when creating', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const row = makeRow({ tags: 'vip, speaker, sponsor' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row])

      expect(pb.collection('contacts').create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: JSON.stringify(['vip', 'speaker', 'sponsor'])
        })
      )
    })

    it('should store empty tags array when no tags provided', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const row = makeRow({ tags: '' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row])

      expect(pb.collection('contacts').create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: JSON.stringify([])
        })
      )
    })
  })

  describe('skip strategy', () => {
    it('should skip existing contacts and not update them', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact()
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [makeRow()], 'skip')

      expect(result.total).toBe(1)
      expect(result.created).toBe(0)
      expect(result.updated).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toEqual([])
      expect(pb.collection('contacts').update).not.toHaveBeenCalled()
      expect(pb.collection('contacts').create).not.toHaveBeenCalled()
    })

    it('should create non-existing contacts even in skip mode', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact()

      pb.collection('contacts')
        .getList.mockResolvedValueOnce(oneMatch(existing))
        .mockResolvedValueOnce(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [
        makeRow({ email: 'alice@example.com' }),
        makeRow({ email: 'bob@example.com', firstName: 'Bob', lastName: 'Dupont' })
      ]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows, 'skip')

      expect(result.skipped).toBe(1)
      expect(result.created).toBe(1)
    })
  })

  describe('merge strategy', () => {
    it('should only fill empty fields on existing contact', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        firstName: 'Alice',
        lastName: 'Martin',
        company: '',
        jobTitle: '',
        phone: '',
        city: '',
        country: ''
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({
        firstName: 'AliceNew',
        lastName: 'MartinNew',
        company: 'NewCorp',
        jobTitle: 'CTO',
        phone: '+33699999999',
        city: 'Lyon',
        country: 'France'
      })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row], 'merge')

      expect(result.updated).toBe(1)
      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({
          company: 'NewCorp',
          jobTitle: 'CTO',
          phone: '+33699999999',
          city: 'Lyon',
          country: 'France'
        })
      )

      // firstName and lastName should NOT be overwritten since they are already set
      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      expect(updateCall.firstName).toBeUndefined()
      expect(updateCall.lastName).toBeUndefined()
    })

    it('should not update fields that already have values', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        firstName: 'Alice',
        lastName: 'Martin',
        company: 'OldCorp',
        jobTitle: 'Dev',
        phone: '+33600000000',
        city: 'Paris',
        country: 'France'
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({
        company: 'NewCorp',
        jobTitle: 'CTO',
        phone: '+33699999999',
        city: 'Lyon',
        country: 'Germany'
      })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row], 'merge')

      // All fields have values already, no update needed except potentially tags
      // With no tags in the row, nothing should be updated -> skipped
      expect(result.skipped).toBe(1)
      expect(pb.collection('contacts').update).not.toHaveBeenCalled()
    })

    it('should fill empty firstName and lastName if they are falsy', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        firstName: '',
        lastName: ''
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ firstName: 'Alice', lastName: 'Martin' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'merge')

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({
          firstName: 'Alice',
          lastName: 'Martin'
        })
      )
    })

    it('should use merge strategy by default when no strategy is specified', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        company: ''
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ company: 'NewCorp' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row])

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({
          company: 'NewCorp'
        })
      )
    })
  })

  describe('overwrite strategy', () => {
    it('should replace all fields on existing contact', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        firstName: 'OldFirst',
        lastName: 'OldLast',
        company: 'OldCorp',
        jobTitle: 'OldTitle',
        phone: '+33600000000',
        city: 'OldCity',
        country: 'OldCountry'
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({
        firstName: 'NewFirst',
        lastName: 'NewLast',
        company: 'NewCorp',
        jobTitle: 'NewTitle',
        phone: '+33699999999',
        city: 'NewCity',
        country: 'NewCountry'
      })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row], 'overwrite')

      expect(result.updated).toBe(1)
      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'contact-1',
        expect.objectContaining({
          firstName: 'NewFirst',
          lastName: 'NewLast',
          company: 'NewCorp',
          jobTitle: 'NewTitle',
          phone: '+33699999999',
          city: 'NewCity',
          country: 'NewCountry'
        })
      )
    })

    it('should not include undefined optional fields in overwrite update', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        company: 'OldCorp',
        jobTitle: 'OldTitle'
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({
        firstName: 'NewFirst',
        lastName: 'NewLast',
        company: undefined,
        jobTitle: undefined,
        phone: undefined,
        city: undefined,
        country: undefined
      })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'overwrite')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      expect(updateCall.firstName).toBe('NewFirst')
      expect(updateCall.lastName).toBe('NewLast')
      expect(updateCall).not.toHaveProperty('company')
      expect(updateCall).not.toHaveProperty('jobTitle')
      expect(updateCall).not.toHaveProperty('phone')
      expect(updateCall).not.toHaveProperty('city')
      expect(updateCall).not.toHaveProperty('country')
    })
  })

  describe('tag merging', () => {
    it('should merge new tags with existing tags', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        tags: ['vip', 'speaker']
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'sponsor, attendee' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'merge')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      const tags = JSON.parse(updateCall.tags as string) as string[]
      expect(tags).toContain('vip')
      expect(tags).toContain('speaker')
      expect(tags).toContain('sponsor')
      expect(tags).toContain('attendee')
      expect(tags).toHaveLength(4)
    })

    it('should deduplicate tags when merging', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        tags: ['vip', 'speaker']
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'vip, speaker, sponsor' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'merge')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      const tags = JSON.parse(updateCall.tags as string) as string[]
      expect(tags).toEqual(['vip', 'speaker', 'sponsor'])
    })

    it('should handle tags merging when existing contact has no tags', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        tags: null
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'vip, speaker' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'skip')

      // Skip strategy skips the contact entirely, so no tag merge occurs
      expect(pb.collection('contacts').update).not.toHaveBeenCalled()
    })

    it('should merge tags even with overwrite strategy', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        tags: ['existing-tag']
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'new-tag' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'overwrite')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      const tags = JSON.parse(updateCall.tags as string) as string[]
      expect(tags).toContain('existing-tag')
      expect(tags).toContain('new-tag')
    })

    it('should handle tags with null existing tags array', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({
        tags: null
      })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'vip' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'merge')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      const tags = JSON.parse(updateCall.tags as string) as string[]
      expect(tags).toEqual(['vip'])
    })

    it('should skip empty tag strings when splitting', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({ tags: [] })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))

      const row = makeRow({ tags: 'vip, , , speaker' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-1', [row], 'merge')

      const updateCall = pb.collection('contacts').update.mock.calls[0][1]
      const tags = JSON.parse(updateCall.tags as string) as string[]
      expect(tags).toEqual(['vip', 'speaker'])
    })
  })

  describe('missing required fields', () => {
    it('should report error when email is missing', async () => {
      const pb = createMockPb()
      const row = makeRow({ email: '' })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        row: 1,
        email: '',
        error: 'Missing required fields (email, firstName, lastName)'
      })
      expect(pb.collection('contacts').getList).not.toHaveBeenCalled()
    })

    it('should report error when firstName is missing', async () => {
      const pb = createMockPb()
      const row = makeRow({ firstName: '' })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].row).toBe(1)
      expect(result.errors[0].email).toBe('alice@example.com')
      expect(result.errors[0].error).toContain('Missing required fields')
    })

    it('should report error when lastName is missing', async () => {
      const pb = createMockPb()
      const row = makeRow({ lastName: '' })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Missing required fields')
    })

    it('should report correct row numbers (1-indexed) for errors', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [
        makeRow({ email: 'good@example.com' }),
        makeRow({ email: '' }),
        makeRow({ email: 'alsogood@example.com' }),
        makeRow({ firstName: '' })
      ]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows)

      expect(result.total).toBe(4)
      expect(result.created).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].row).toBe(2)
      expect(result.errors[1].row).toBe(4)
    })

    it('should continue processing remaining rows after validation error', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [makeRow({ email: '' }), makeRow({ email: 'valid@example.com' })]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows)

      expect(result.errors).toHaveLength(1)
      expect(result.created).toBe(1)
    })
  })

  describe('PocketBase error handling', () => {
    it('should capture PocketBase getList errors as row errors', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockRejectedValue(new Error('Network error'))

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [makeRow()])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].row).toBe(1)
      expect(result.errors[0].email).toBe('alice@example.com')
      expect(result.errors[0].error).toContain('Network error')
    })

    it('should capture PocketBase create errors as row errors', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockRejectedValue(new Error('Validation failed'))

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [makeRow()])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Validation failed')
      expect(result.created).toBe(0)
    })

    it('should capture PocketBase update errors as row errors', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({ company: '' })
      pb.collection('contacts').getList.mockResolvedValue(oneMatch(existing))
      pb.collection('contacts').update.mockRejectedValue(new Error('Update failed'))

      const row = makeRow({ company: 'NewCorp' })

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [row], 'merge')

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('Update failed')
      expect(result.updated).toBe(0)
    })

    it('should continue processing after PocketBase error on one row', async () => {
      const pb = createMockPb()
      pb.collection('contacts')
        .getList.mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [
        makeRow({ email: 'fail@example.com' }),
        makeRow({ email: 'success@example.com' })
      ]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].email).toBe('fail@example.com')
      expect(result.created).toBe(1)
    })

    it('should stringify non-Error thrown values', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockRejectedValue('string error')

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [makeRow()])

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('string error')
    })
  })

  describe('result aggregation', () => {
    it('should return correct totals for mixed outcomes', async () => {
      const pb = createMockPb()
      const existing = makeExistingContact({ company: 'Existing' })

      // Row 1: missing email -> error
      // Row 2: existing, skip strategy -> skipped
      // Row 3: new contact -> created
      // Row 4: PB error -> error
      pb.collection('contacts')
        .getList.mockResolvedValueOnce(oneMatch(existing))
        .mockResolvedValueOnce(noMatch())
        .mockRejectedValueOnce(new Error('DB error'))

      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const rows = [
        makeRow({ email: '' }),
        makeRow({ email: 'alice@example.com' }),
        makeRow({ email: 'new@example.com', firstName: 'New', lastName: 'Person' }),
        makeRow({ email: 'error@example.com', firstName: 'Err', lastName: 'Person' })
      ]

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', rows, 'skip')

      expect(result.total).toBe(4)
      expect(result.created).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(2)
    })

    it('should handle empty rows array', async () => {
      const pb = createMockPb()

      const importContacts = createImportContactsUseCase(pb)
      const result = await importContacts('event-1', [])

      expect(result.total).toBe(0)
      expect(result.created).toBe(0)
      expect(result.updated).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.errors).toEqual([])
      expect(pb.collection).not.toHaveBeenCalled()
    })
  })

  describe('PocketBase filter construction', () => {
    it('should query contacts with correct eventId and email filter', async () => {
      const pb = createMockPb()
      pb.collection('contacts').getList.mockResolvedValue(noMatch())
      pb.collection('contacts').create.mockResolvedValue({ id: 'new-1' })

      const row = makeRow({ email: 'test@example.com' })

      const importContacts = createImportContactsUseCase(pb)
      await importContacts('event-42', [row])

      expect(pb.collection).toHaveBeenCalledWith('contacts')
      expect(pb.collection('contacts').getList).toHaveBeenCalledWith(1, 1, {
        filter: 'eventId = "event-42" && email = "test@example.com"'
      })
    })
  })
})
