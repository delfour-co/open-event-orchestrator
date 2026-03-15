import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEditionRepository } from './edition-repository'

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

const makeEditionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'ed1',
  eventId: 'evt1',
  name: 'Edition 2024',
  slug: 'edition-2024',
  year: 2024,
  startDate: '2024-06-01T00:00:00Z',
  endDate: '2024-06-03T00:00:00Z',
  venue: 'Convention Center',
  city: 'Paris',
  country: 'France',
  status: 'published',
  termsOfSale: 'Terms text',
  codeOfConduct: 'CoC text',
  privacyPolicy: 'Privacy text',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('EditionRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create an edition with ISO date strings and default status', async () => {
      const record = makeEditionRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const input = {
        eventId: 'evt1',
        name: 'Edition 2024',
        slug: 'edition-2024',
        year: 2024,
        startDate: new Date('2024-06-01T00:00:00Z'),
        endDate: new Date('2024-06-03T00:00:00Z')
      }
      const result = await repo.create(input as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('editions')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-06-01T00:00:00.000Z',
          endDate: '2024-06-03T00:00:00.000Z',
          status: 'draft'
        })
      )
      expect(result.id).toBe('ed1')
      expect(result.eventId).toBe('evt1')
      expect(result.name).toBe('Edition 2024')
      expect(result.year).toBe(2024)
      expect(result.startDate).toEqual(new Date('2024-06-01T00:00:00Z'))
      expect(result.endDate).toEqual(new Date('2024-06-03T00:00:00Z'))
      expect(result.status).toBe('published')
      expect(result.venue).toBe('Convention Center')
      expect(result.city).toBe('Paris')
      expect(result.country).toBe('France')
    })

    it('should use provided status instead of default', async () => {
      const record = makeEditionRecord({ status: 'published' })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const input = {
        eventId: 'evt1',
        name: 'Ed',
        slug: 'ed',
        year: 2024,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-03'),
        status: 'published'
      }
      await repo.create(input as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }))
    })

    it('should map empty optional fields to undefined', async () => {
      const record = makeEditionRecord({
        venue: '',
        city: '',
        country: '',
        termsOfSale: '',
        codeOfConduct: '',
        privacyPolicy: ''
      })
      mockPb._mockCollection.mockReturnValue({
        create: vi.fn().mockResolvedValue(record)
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        eventId: 'evt1',
        name: 'Ed',
        slug: 'ed',
        year: 2024,
        startDate: new Date(),
        endDate: new Date()
      } as never)

      expect(result.venue).toBeUndefined()
      expect(result.city).toBeUndefined()
      expect(result.country).toBeUndefined()
      expect(result.termsOfSale).toBeUndefined()
      expect(result.codeOfConduct).toBeUndefined()
      expect(result.privacyPolicy).toBeUndefined()
    })
  })

  describe('findById', () => {
    it('should return edition when found', async () => {
      const record = makeEditionRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('ed1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('ed1')
      expect(result?.name).toBe('Edition 2024')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should return edition when found by slug', async () => {
      const record = makeEditionRecord()
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(record)
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('edition-2024')

      expect(result).not.toBeNull()
      expect(result?.slug).toBe('edition-2024')
    })

    it('should return null when slug not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBySlug('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByEvent', () => {
    it('should return editions filtered by eventId sorted by year', async () => {
      const records = [
        makeEditionRecord({ id: 'ed2', year: 2025, name: 'Edition 2025' }),
        makeEditionRecord({ id: 'ed1', year: 2024, name: 'Edition 2024' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt1'),
          sort: '-year'
        })
      )
    })

    it('should return empty array when no editions for event', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt-empty')

      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('should update edition and convert dates to ISO strings', async () => {
      const record = makeEditionRecord({ name: 'Updated Edition' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('ed1', {
        name: 'Updated Edition',
        startDate: new Date('2024-07-01T00:00:00Z'),
        endDate: new Date('2024-07-03T00:00:00Z')
      } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'ed1',
        expect.objectContaining({
          name: 'Updated Edition',
          startDate: '2024-07-01T00:00:00.000Z',
          endDate: '2024-07-03T00:00:00.000Z'
        })
      )
      expect(result.name).toBe('Updated Edition')
    })

    it('should not convert dates when not provided in update', async () => {
      const record = makeEditionRecord({ name: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      await repo.update('ed1', { name: 'Updated' } as never)

      const callArg = mockUpdate.mock.calls[0][1]
      expect(callArg.name).toBe('Updated')
      expect(callArg).not.toHaveProperty('startDate')
      expect(callArg).not.toHaveProperty('endDate')
    })
  })

  describe('delete', () => {
    it('should delete edition by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEditionRepository(mockPb as unknown as PocketBase)
      await repo.delete('ed1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('editions')
      expect(mockDelete).toHaveBeenCalledWith('ed1')
    })
  })
})
