import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorRepository } from './sponsor-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://example.com/logo.png')
  }
  return {
    collection: mockCollection,
    files: mockFiles,
    _mockCollection: mockCollection
  }
}

const makeSponsorRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'sp1',
  organizationId: 'org1',
  name: 'Acme Corp',
  logo: 'logo.png',
  website: 'https://acme.com',
  description: 'Tech company',
  contactName: 'John Doe',
  contactEmail: 'john@acme.com',
  contactPhone: '+1234567890',
  notes: 'VIP sponsor',
  legalName: 'Acme Corp SAS',
  vatNumber: 'FR12345678901',
  siret: '12345678901234',
  billingAddress: '123 Main St',
  billingCity: 'Paris',
  billingPostalCode: '75001',
  billingCountry: 'France',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SponsorRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return a sponsor when found', async () => {
      const record = makeSponsorRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('sp1')

      expect(result?.id).toBe('sp1')
      expect(result?.name).toBe('Acme Corp')
      expect(result?.contactEmail).toBe('john@acme.com')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByOrganization', () => {
    it('should return sponsors for an organization', async () => {
      const records = [makeSponsorRecord(), makeSponsorRecord({ id: 'sp2', name: 'Beta Inc' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'name' }))
    })
  })

  describe('findAll', () => {
    it('should return all sponsors sorted by name', async () => {
      const records = [makeSponsorRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAll()

      expect(result).toHaveLength(1)
    })
  })

  describe('search', () => {
    it('should search sponsors by name', async () => {
      const records = [makeSponsorRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.search('Acme')

      expect(result).toHaveLength(1)
    })

    it('should filter by organization when provided', async () => {
      const records = [makeSponsorRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.search('Acme', 'org1')

      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a sponsor with all fields', async () => {
      const record = makeSponsorRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        organizationId: 'org1',
        name: 'Acme Corp',
        contactName: 'John Doe',
        contactEmail: 'john@acme.com'
      })

      expect(result?.name).toBe('Acme Corp')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org1',
          name: 'Acme Corp'
        })
      )
    })
  })

  describe('update', () => {
    it('should update name when provided', async () => {
      const record = makeSponsorRecord({ name: 'New Name' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('sp1', { name: 'New Name' })

      expect(result?.name).toBe('New Name')
      expect(mockUpdate).toHaveBeenCalledWith('sp1', { name: 'New Name' })
    })

    it('should set nullable fields to null when empty string', async () => {
      const record = makeSponsorRecord({ website: '' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      await repo.update('sp1', { website: '' })

      expect(mockUpdate).toHaveBeenCalledWith('sp1', { website: null })
    })
  })

  describe('updateLogo', () => {
    it('should update the logo with a file via FormData', async () => {
      const record = makeSponsorRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const file = new File(['data'], 'newlogo.png', { type: 'image/png' })
      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.updateLogo('sp1', file)

      expect(result?.id).toBe('sp1')
      expect(mockUpdate).toHaveBeenCalledWith('sp1', expect.any(FormData))
    })
  })

  describe('removeLogo', () => {
    it('should set logo to null', async () => {
      const record = makeSponsorRecord({ logo: '' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      await repo.removeLogo('sp1')

      expect(mockUpdate).toHaveBeenCalledWith('sp1', { logo: null })
    })
  })

  describe('delete', () => {
    it('should delete a sponsor', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      await repo.delete('sp1')

      expect(mockDelete).toHaveBeenCalledWith('sp1')
    })
  })

  describe('getLogoUrl', () => {
    it('should return logo URL when logo exists', () => {
      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const sponsor = {
        id: 'sp1',
        organizationId: 'org1',
        name: 'Acme',
        logo: 'logo.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const url = repo.getLogoUrl(sponsor)

      expect(url).toBe('https://example.com/logo.png')
    })

    it('should return null when no logo', () => {
      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const sponsor = {
        id: 'sp1',
        organizationId: 'org1',
        name: 'Acme',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const url = repo.getLogoUrl(sponsor)

      expect(url).toBeNull()
    })
  })

  describe('getLogoThumbUrl', () => {
    it('should return thumb URL with default size', () => {
      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const sponsor = {
        id: 'sp1',
        organizationId: 'org1',
        name: 'Acme',
        logo: 'logo.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const url = repo.getLogoThumbUrl(sponsor)

      expect(url).toBe('https://example.com/logo.png')
      expect(mockPb.files.getURL).toHaveBeenCalledWith(expect.any(Object), 'logo.png', {
        thumb: '200x200'
      })
    })

    it('should return null when no logo', () => {
      const repo = createSponsorRepository(mockPb as unknown as PocketBase)
      const sponsor = {
        id: 'sp1',
        organizationId: 'org1',
        name: 'Acme',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const url = repo.getLogoThumbUrl(sponsor)

      expect(url).toBeNull()
    })
  })
})
