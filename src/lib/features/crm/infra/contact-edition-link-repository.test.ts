import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContactEditionLinkRepository } from './contact-edition-link-repository'

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

const makeLinkRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'link1',
  contactId: 'contact1',
  editionId: 'ed1',
  roles: ['speaker', 'attendee'],
  speakerId: 'spk1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('ContactEditionLinkRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return link when found', async () => {
      const record = makeLinkRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('link1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('link1')
      expect(result?.contactId).toBe('contact1')
      expect(result?.roles).toEqual(['speaker', 'attendee'])
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse roles from JSON string', async () => {
      const record = makeLinkRecord({ roles: '["speaker","attendee"]' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('link1')

      expect(result?.roles).toEqual(['speaker', 'attendee'])
    })

    it('should return empty roles when invalid', async () => {
      const record = makeLinkRecord({ roles: 'invalid' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('link1')

      expect(result?.roles).toEqual([])
    })
  })

  describe('findByContact', () => {
    it('should return links filtered by contactId', async () => {
      const records = [makeLinkRecord({ id: 'link1' }), makeLinkRecord({ id: 'link2' })]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContact('contact1')

      expect(result).toHaveLength(2)
    })

    it('should return empty array when no links for contact', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContact('contact-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByEdition', () => {
    it('should return links filtered by editionId', async () => {
      const records = [makeLinkRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('ed1'),
          sort: '-created'
        })
      )
    })
  })

  describe('findByContactAndEdition', () => {
    it('should return link when found', async () => {
      const record = makeLinkRecord()
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [record] })
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContactAndEdition('contact1', 'ed1')

      expect(result).not.toBeNull()
      expect(result?.contactId).toBe('contact1')
      expect(result?.editionId).toBe('ed1')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContactAndEdition('contact1', 'ed-other')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockRejectedValue(new Error('Error'))
      })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContactAndEdition('contact1', 'ed1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a link and stringify roles', async () => {
      const record = makeLinkRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        contactId: 'contact1',
        editionId: 'ed1',
        roles: ['speaker']
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('contact_edition_links')
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ roles: '["speaker"]' }))
      expect(result.id).toBe('link1')
    })
  })

  describe('update', () => {
    it('should update link and stringify roles when provided', async () => {
      const record = makeLinkRecord({ roles: ['organizer'] })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      await repo.update('link1', { roles: ['organizer'] } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'link1',
        expect.objectContaining({ roles: '["organizer"]' })
      )
    })

    it('should update without stringifying when roles not provided', async () => {
      const record = makeLinkRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      await repo.update('link1', { speakerId: 'spk2' } as never)

      const updateCall = mockUpdate.mock.calls[0][1]
      expect(updateCall.speakerId).toBe('spk2')
    })
  })

  describe('delete', () => {
    it('should delete link by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createContactEditionLinkRepository(mockPb as unknown as PocketBase)
      await repo.delete('link1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('contact_edition_links')
      expect(mockDelete).toHaveBeenCalledWith('link1')
    })
  })
})
