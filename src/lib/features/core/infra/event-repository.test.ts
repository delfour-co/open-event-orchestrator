import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEventRepository } from './event-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeEventRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt1',
  organizationId: 'org1',
  name: 'Test Event',
  slug: 'test-event',
  description: 'A test event',
  logo: 'logo.png',
  website: 'https://event.com',
  currency: 'EUR',
  banner: 'banner.png',
  primaryColor: '#ff0000',
  secondaryColor: '#00ff00',
  twitter: '@event',
  linkedin: 'event-linkedin',
  hashtag: '#testevent',
  contactEmail: 'contact@event.com',
  codeOfConductUrl: 'https://event.com/coc',
  privacyPolicyUrl: 'https://event.com/privacy',
  timezone: 'Europe/Paris',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('EventRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create an event and map the result', async () => {
      const record = makeEventRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        organizationId: 'org1',
        name: 'Test Event',
        slug: 'test-event'
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('events')
      expect(result.id).toBe('evt1')
      expect(result.organizationId).toBe('org1')
      expect(result.name).toBe('Test Event')
      expect(result.slug).toBe('test-event')
      expect(result.currency).toBe('EUR')
      expect(result.description).toBe('A test event')
      expect(result.banner).toBe('banner.png')
      expect(result.hashtag).toBe('#testevent')
      expect(result.contactEmail).toBe('contact@event.com')
      expect(result.codeOfConductUrl).toBe('https://event.com/coc')
      expect(result.privacyPolicyUrl).toBe('https://event.com/privacy')
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(result.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'))
    })

    it('should map empty optional fields to undefined', async () => {
      const record = makeEventRecord({
        description: '',
        logo: '',
        website: '',
        banner: '',
        primaryColor: '',
        secondaryColor: '',
        twitter: '',
        linkedin: '',
        hashtag: '',
        contactEmail: '',
        codeOfConductUrl: '',
        privacyPolicyUrl: '',
        timezone: ''
      })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({ name: 'Test' } as never)

      expect(result.description).toBeUndefined()
      expect(result.logo).toBeUndefined()
      expect(result.website).toBeUndefined()
      expect(result.banner).toBeUndefined()
      expect(result.twitter).toBeUndefined()
      expect(result.contactEmail).toBeUndefined()
    })

    it('should default currency to USD when empty', async () => {
      const record = makeEventRecord({ currency: '' })
      mockPb._mockCollection.mockReturnValue({
        create: vi.fn().mockResolvedValue(record)
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({ name: 'Test' } as never)

      expect(result.currency).toBe('USD')
    })
  })

  describe('findById', () => {
    it('should return event when found', async () => {
      const record = makeEventRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('evt1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('evt1')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should return event when found by slug', async () => {
      const record = makeEventRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('test-event')

      expect(result).not.toBeNull()
      expect(result?.slug).toBe('test-event')
    })

    it('should return null when slug not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByOrganization', () => {
    it('should return events filtered by organizationId', async () => {
      const records = [
        makeEventRecord({ id: 'evt1', name: 'Event 1' }),
        makeEventRecord({ id: 'evt2', name: 'Event 2' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org1')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('evt1')
      expect(result[1].id).toBe('evt2')
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ filter: expect.stringContaining('org1') })
      )
    })

    it('should return empty array when no events for organization', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org-empty')

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should update event and return mapped result', async () => {
      const record = makeEventRecord({ name: 'Updated Event' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('evt1', { name: 'Updated Event' } as never)

      expect(mockUpdate).toHaveBeenCalledWith('evt1', { name: 'Updated Event' })
      expect(result.name).toBe('Updated Event')
    })
  })

  describe('delete', () => {
    it('should delete event by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEventRepository(mockPb as unknown as PocketBase)
      await repo.delete('evt1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('events')
      expect(mockDelete).toHaveBeenCalledWith('evt1')
    })
  })
})
