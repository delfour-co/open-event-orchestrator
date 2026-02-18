import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorAssetService } from './sponsor-asset-service'

// Mock the repository
vi.mock('../infra/sponsor-asset-repository', () => ({
  createSponsorAssetRepository: vi.fn()
}))

import { createSponsorAssetRepository } from '../infra/sponsor-asset-repository'

describe('SponsorAssetService', () => {
  let mockPb: PocketBase
  let mockAssetRepo: ReturnType<typeof vi.fn>
  let service: ReturnType<typeof createSponsorAssetService>

  const mockAsset = {
    id: 'asset-1',
    editionSponsorId: 'es-1',
    category: 'logo' as const,
    name: 'Primary Logo',
    description: 'Main logo for website',
    file: 'logo.png',
    fileSize: 102400,
    mimeType: 'image/png',
    width: 800,
    height: 600,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    mockPb = {} as PocketBase

    mockAssetRepo = {
      findById: vi.fn(),
      findByEditionSponsor: vi.fn(),
      findByEditionSponsorAndCategory: vi.fn(),
      create: vi.fn().mockResolvedValue(mockAsset),
      update: vi.fn(),
      delete: vi.fn(),
      getFileUrl: vi.fn().mockReturnValue('https://example.com/files/logo.png'),
      getThumbUrl: vi.fn().mockReturnValue('https://example.com/files/logo_200x200.png'),
      getFileBlob: vi.fn()
    }

    vi.mocked(createSponsorAssetRepository).mockReturnValue(mockAssetRepo)

    service = createSponsorAssetService(mockPb)
  })

  describe('validateFile', () => {
    it('should accept valid PNG file', () => {
      const file = new File(['content'], 'logo.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      const result = service.validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid JPEG file', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      const result = service.validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('should accept valid PDF file', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      const result = service.validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('should reject file exceeding size limit', () => {
      const file = new File(['content'], 'large.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 }) // 51MB

      const result = service.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds')
    })

    it('should reject invalid mime type', () => {
      const file = new File(['content'], 'script.js', { type: 'application/javascript' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = service.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject mismatched extension and mime type', () => {
      const file = new File(['content'], 'image.png', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = service.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('extension does not match')
    })
  })

  describe('uploadAsset', () => {
    it('should upload valid asset', async () => {
      const file = new File(['content'], 'logo.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 })

      // Mock getImageDimensions
      service.getImageDimensions = vi.fn().mockResolvedValue({ width: 800, height: 600 })

      const result = await service.uploadAsset(
        {
          editionSponsorId: 'es-1',
          category: 'logo',
          name: 'Primary Logo'
        },
        file
      )

      expect(result).toEqual(mockAsset)
      expect(mockAssetRepo.create).toHaveBeenCalled()
    })

    it('should throw error for invalid file', async () => {
      const file = new File(['content'], 'script.js', { type: 'application/javascript' })
      Object.defineProperty(file, 'size', { value: 1024 })

      await expect(
        service.uploadAsset(
          {
            editionSponsorId: 'es-1',
            category: 'logo',
            name: 'Invalid'
          },
          file
        )
      ).rejects.toThrow('Invalid file type')
    })
  })

  describe('getAssetsByEditionSponsor', () => {
    it('should return all assets for sponsor', async () => {
      mockAssetRepo.findByEditionSponsor.mockResolvedValue([mockAsset])

      const result = await service.getAssetsByEditionSponsor('es-1')

      expect(result).toEqual([mockAsset])
      expect(mockAssetRepo.findByEditionSponsor).toHaveBeenCalledWith('es-1')
    })
  })

  describe('getAssetsByCategory', () => {
    it('should return assets filtered by category', async () => {
      mockAssetRepo.findByEditionSponsorAndCategory.mockResolvedValue([mockAsset])

      const result = await service.getAssetsByCategory('es-1', 'logo')

      expect(result).toEqual([mockAsset])
      expect(mockAssetRepo.findByEditionSponsorAndCategory).toHaveBeenCalledWith('es-1', 'logo')
    })
  })

  describe('getAssetById', () => {
    it('should return asset by id', async () => {
      mockAssetRepo.findById.mockResolvedValue(mockAsset)

      const result = await service.getAssetById('asset-1')

      expect(result).toEqual(mockAsset)
      expect(mockAssetRepo.findById).toHaveBeenCalledWith('asset-1')
    })

    it('should return null for non-existent asset', async () => {
      mockAssetRepo.findById.mockResolvedValue(null)

      const result = await service.getAssetById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateAsset', () => {
    it('should update asset metadata', async () => {
      const updatedAsset = { ...mockAsset, name: 'Updated Logo' }
      mockAssetRepo.update.mockResolvedValue(updatedAsset)

      const result = await service.updateAsset('asset-1', { name: 'Updated Logo' })

      expect(result.name).toBe('Updated Logo')
      expect(mockAssetRepo.update).toHaveBeenCalledWith('asset-1', { name: 'Updated Logo' })
    })
  })

  describe('deleteAsset', () => {
    it('should delete asset', async () => {
      mockAssetRepo.delete.mockResolvedValue(undefined)

      await service.deleteAsset('asset-1')

      expect(mockAssetRepo.delete).toHaveBeenCalledWith('asset-1')
    })
  })

  describe('getFileUrl', () => {
    it('should return file URL', () => {
      const url = service.getFileUrl(mockAsset)

      expect(url).toBe('https://example.com/files/logo.png')
      expect(mockAssetRepo.getFileUrl).toHaveBeenCalledWith(mockAsset)
    })
  })

  describe('getThumbUrl', () => {
    it('should return thumbnail URL with default size', () => {
      const url = service.getThumbUrl(mockAsset)

      expect(url).toBe('https://example.com/files/logo_200x200.png')
      expect(mockAssetRepo.getThumbUrl).toHaveBeenCalledWith(mockAsset, '200x200')
    })

    it('should return thumbnail URL with custom size', () => {
      service.getThumbUrl(mockAsset, '400x400')

      expect(mockAssetRepo.getThumbUrl).toHaveBeenCalledWith(mockAsset, '400x400')
    })
  })
})
