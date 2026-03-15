import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorAssetRepository } from './sponsor-asset-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://example.com/file.png')
  }
  return {
    collection: mockCollection,
    files: mockFiles,
    _mockCollection: mockCollection
  }
}

const makeAssetRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'asset1',
  editionSponsorId: 'es1',
  category: 'logo',
  name: 'Main Logo',
  description: 'Primary logo',
  file: 'logo.png',
  fileSize: 12345,
  mimeType: 'image/png',
  width: 200,
  height: 100,
  usage: 'website',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SponsorAssetRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return an asset when found', async () => {
      const record = makeAssetRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('asset1')

      expect(result?.id).toBe('asset1')
      expect(result?.category).toBe('logo')
      expect(result?.name).toBe('Main Logo')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByEditionSponsor', () => {
    it('should return assets for an edition sponsor', async () => {
      const records = [makeAssetRecord(), makeAssetRecord({ id: 'asset2', name: 'Banner' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsor('es1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'category,name' })
      )
    })
  })

  describe('findByEditionSponsorAndCategory', () => {
    it('should filter by edition sponsor and category', async () => {
      const records = [makeAssetRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsorAndCategory('es1', 'logo')

      expect(result).toHaveLength(1)
    })
  })

  describe('findByEdition', () => {
    it('should return assets for all sponsors in an edition', async () => {
      const records = [makeAssetRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          expand: 'editionSponsorId,editionSponsorId.sponsorId'
        })
      )
    })
  })

  describe('create', () => {
    it('should create an asset with file via FormData', async () => {
      const record = makeAssetRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const file = new File(['data'], 'logo.png', { type: 'image/png' })
      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.create(
        {
          editionSponsorId: 'es1',
          category: 'logo',
          name: 'Main Logo',
          fileSize: 12345,
          mimeType: 'image/png',
          description: 'Primary logo',
          width: 200,
          height: 100,
          usage: 'website'
        },
        file
      )

      expect(result?.id).toBe('asset1')
      expect(mockCreate).toHaveBeenCalledWith(expect.any(FormData))
    })

    it('should create an asset without optional fields', async () => {
      const record = makeAssetRecord({ description: '', width: 0, height: 0, usage: '' })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.create(
        {
          editionSponsorId: 'es1',
          category: 'document',
          name: 'Contract',
          fileSize: 5000,
          mimeType: 'application/pdf'
        },
        file
      )

      expect(result?.id).toBe('asset1')
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeAssetRecord({ name: 'Updated Logo' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('asset1', { name: 'Updated Logo' })

      expect(result?.name).toBe('Updated Logo')
      expect(mockUpdate).toHaveBeenCalledWith('asset1', { name: 'Updated Logo' })
    })
  })

  describe('delete', () => {
    it('should delete an asset', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      await repo.delete('asset1')

      expect(mockDelete).toHaveBeenCalledWith('asset1')
    })
  })

  describe('deleteByEditionSponsor', () => {
    it('should delete all assets for an edition sponsor', async () => {
      const records = [makeAssetRecord({ id: 'a1' }), makeAssetRecord({ id: 'a2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete
      })

      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      await repo.deleteByEditionSponsor('es1')

      expect(mockDelete).toHaveBeenCalledTimes(2)
    })
  })

  describe('getFileUrl', () => {
    it('should return the file URL for an asset', () => {
      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const asset = makeAssetRecord()
      const url = repo.getFileUrl(
        asset as ReturnType<typeof repo.findById> extends Promise<infer T> ? NonNullable<T> : never
      )

      expect(mockPb.files.getURL).toHaveBeenCalled()
      expect(url).toBe('https://example.com/file.png')
    })
  })

  describe('getThumbUrl', () => {
    it('should return the thumb URL with specified size', () => {
      const repo = createSponsorAssetRepository(mockPb as unknown as PocketBase)
      const asset = makeAssetRecord()
      const url = repo.getThumbUrl(
        asset as ReturnType<typeof repo.findById> extends Promise<infer T> ? NonNullable<T> : never,
        '400x400'
      )

      expect(mockPb.files.getURL).toHaveBeenCalledWith(expect.any(Object), 'logo.png', {
        thumb: '400x400'
      })
      expect(url).toBe('https://example.com/file.png')
    })
  })
})
