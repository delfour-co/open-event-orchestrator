import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContactRepository } from './contact-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...parts: string[]) => parts.join(' && '),
  filterOr: (...parts: string[]) => `(${parts.join(' || ')})`,
  filterContains: (field: string, value: string) => `${field} ~ "${value}"`,
  filterIn: (field: string, values: string[]) =>
    `${field} IN [${values.map((v) => `"${v}"`).join(',')}]`
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeContactRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'contact1',
  eventId: 'evt1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Acme',
  jobTitle: 'Developer',
  phone: '+33123456789',
  address: '123 Main St',
  bio: 'A developer',
  photoUrl: 'https://example.com/photo.jpg',
  twitter: '@john',
  linkedin: 'john-doe',
  github: 'johndoe',
  city: 'Paris',
  country: 'France',
  source: 'manual',
  tags: ['speaker', 'vip'],
  notes: 'Important contact',
  unsubscribeToken: 'token123',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('ContactRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return contact when found', async () => {
      const record = makeContactRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('contact1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('contact1')
      expect(result?.email).toBe('john@example.com')
      expect(result?.firstName).toBe('John')
      expect(result?.tags).toEqual(['speaker', 'vip'])
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse tags from JSON string', async () => {
      const record = makeContactRecord({ tags: '["speaker","vip"]' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('contact1')

      expect(result?.tags).toEqual(['speaker', 'vip'])
    })

    it('should return empty tags when tags is invalid', async () => {
      const record = makeContactRecord({ tags: 'invalid-json' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('contact1')

      expect(result?.tags).toEqual([])
    })

    it('should default source to manual when empty', async () => {
      const record = makeContactRecord({ source: '' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('contact1')

      expect(result?.source).toBe('manual')
    })
  })

  describe('findByEvent', () => {
    it('should return contacts filtered by eventId', async () => {
      const records = [makeContactRecord({ id: 'c1' }), makeContactRecord({ id: 'c2' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1')

      expect(result).toHaveLength(2)
    })

    it('should use getList when limit is provided', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [makeContactRecord()]
      })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1', { limit: 10 })

      expect(result).toHaveLength(1)
      expect(mockGetList).toHaveBeenCalledWith(1, 10, expect.objectContaining({}))
    })

    it('should calculate page from offset when limit is provided', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      await repo.findByEvent('evt1', { limit: 10, offset: 20 })

      expect(mockGetList).toHaveBeenCalledWith(3, 10, expect.objectContaining({}))
    })

    it('should return empty array when no contacts', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByEmail', () => {
    it('should return contact when found by email and eventId', async () => {
      const record = makeContactRecord()
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [record] })
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEmail('john@example.com', 'evt1')

      expect(result).not.toBeNull()
      expect(result?.email).toBe('john@example.com')
    })

    it('should return null when no contact found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEmail('unknown@example.com', 'evt1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockRejectedValue(new Error('Error'))
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEmail('john@example.com', 'evt1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a contact and stringify tags', async () => {
      const record = makeContactRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        eventId: 'evt1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        tags: ['speaker', 'vip']
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('contacts')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ tags: '["speaker","vip"]' })
      )
      expect(result.id).toBe('contact1')
    })
  })

  describe('update', () => {
    it('should update contact and stringify tags when provided', async () => {
      const record = makeContactRecord({ firstName: 'Jane' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('contact1', {
        firstName: 'Jane',
        tags: ['organizer']
      } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'contact1',
        expect.objectContaining({ tags: '["organizer"]' })
      )
      expect(result.firstName).toBe('Jane')
    })

    it('should update without stringifying when tags not provided', async () => {
      const record = makeContactRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      await repo.update('contact1', { firstName: 'Jane' } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'contact1',
        expect.objectContaining({ firstName: 'Jane' })
      )
    })
  })

  describe('delete', () => {
    it('should delete contact by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      await repo.delete('contact1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('contacts')
      expect(mockDelete).toHaveBeenCalledWith('contact1')
    })
  })

  describe('countByEvent', () => {
    it('should return total items count', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 42 })
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEvent('evt1')

      expect(result).toBe(42)
    })

    it('should return zero when no contacts', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 0 })
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEvent('evt-empty')

      expect(result).toBe(0)
    })
  })

  describe('findByIds', () => {
    it('should return contacts matching given ids', async () => {
      const records = [makeContactRecord({ id: 'c1' }), makeContactRecord({ id: 'c2' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIds(['c1', 'c2'])

      expect(result).toHaveLength(2)
    })

    it('should return empty array when ids is empty', async () => {
      const repo = createContactRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIds([])

      expect(result).toEqual([])
    })
  })
})
