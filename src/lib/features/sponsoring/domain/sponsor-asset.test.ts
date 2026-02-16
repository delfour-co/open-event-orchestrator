import { describe, expect, it } from 'vitest'
import {
  ASSET_CATEGORY_LABELS,
  LOGO_CATEGORIES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  type SponsorAsset,
  type SponsorAssetCategory,
  createSponsorAssetSchema,
  formatDimensions,
  formatFileSize,
  getAssetCountByCategory,
  getCategoryDescription,
  getCategoryLabel,
  getLogoAssets,
  groupAssetsByCategory,
  isDocumentMimeType,
  isImageMimeType,
  isLogoCategory,
  sponsorAssetCategorySchema,
  sponsorAssetSchema,
  updateSponsorAssetSchema
} from './sponsor-asset'

describe('Sponsor Asset Domain', () => {
  const validAsset: SponsorAsset = {
    id: 'asset123',
    editionSponsorId: 'editionsponsor123',
    category: 'logo_color',
    name: 'Company Logo',
    description: 'Full color company logo',
    file: 'logo.png',
    fileSize: 1024000,
    mimeType: 'image/png',
    width: 800,
    height: 600,
    usage: 'For web and print',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('sponsorAssetCategorySchema', () => {
    it('should accept all valid categories', () => {
      const categories: SponsorAssetCategory[] = [
        'logo_color',
        'logo_mono',
        'logo_light',
        'logo_dark',
        'visual',
        'document'
      ]

      for (const category of categories) {
        const result = sponsorAssetCategorySchema.safeParse(category)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid category', () => {
      const result = sponsorAssetCategorySchema.safeParse('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('sponsorAssetSchema', () => {
    it('should validate a complete asset', () => {
      const result = sponsorAssetSchema.safeParse(validAsset)
      expect(result.success).toBe(true)
    })

    it('should validate asset with minimal fields', () => {
      const minimal: SponsorAsset = {
        id: 'asset123',
        editionSponsorId: 'editionsponsor123',
        category: 'document',
        name: 'Press Kit',
        file: 'presskit.pdf',
        fileSize: 5000000,
        mimeType: 'application/pdf',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = sponsorAssetSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject asset without name', () => {
      const invalid = { ...validAsset, name: '' }
      const result = sponsorAssetSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject asset with name too long', () => {
      const invalid = { ...validAsset, name: 'a'.repeat(201) }
      const result = sponsorAssetSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject asset with description too long', () => {
      const invalid = { ...validAsset, description: 'a'.repeat(1001) }
      const result = sponsorAssetSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject negative file size', () => {
      const invalid = { ...validAsset, fileSize: -100 }
      const result = sponsorAssetSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject negative dimensions', () => {
      const invalidWidth = { ...validAsset, width: -100 }
      const invalidHeight = { ...validAsset, height: -100 }
      expect(sponsorAssetSchema.safeParse(invalidWidth).success).toBe(false)
      expect(sponsorAssetSchema.safeParse(invalidHeight).success).toBe(false)
    })
  })

  describe('createSponsorAssetSchema', () => {
    it('should omit id, createdAt, updatedAt', () => {
      const createData = {
        editionSponsorId: 'editionsponsor123',
        category: 'logo_color',
        name: 'New Logo',
        file: 'logo.png',
        fileSize: 1024000,
        mimeType: 'image/png',
        width: 800,
        height: 600
      }
      const result = createSponsorAssetSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should require editionSponsorId', () => {
      const createData = {
        category: 'logo_color',
        name: 'New Logo',
        file: 'logo.png',
        fileSize: 1024000,
        mimeType: 'image/png'
      }
      const result = createSponsorAssetSchema.safeParse(createData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateSponsorAssetSchema', () => {
    it('should allow partial updates', () => {
      const updateData = { name: 'Updated Name' }
      const result = updateSponsorAssetSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateSponsorAssetSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should allow category update', () => {
      const updateData = { category: 'logo_dark' }
      const result = updateSponsorAssetSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid category', () => {
      const updateData = { category: 'invalid_category' }
      const result = updateSponsorAssetSchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })
  })

  describe('getCategoryLabel', () => {
    it('should return correct labels for all categories', () => {
      expect(getCategoryLabel('logo_color')).toBe('Logo (Color)')
      expect(getCategoryLabel('logo_mono')).toBe('Logo (Monochrome)')
      expect(getCategoryLabel('logo_light')).toBe('Logo (Light Background)')
      expect(getCategoryLabel('logo_dark')).toBe('Logo (Dark Background)')
      expect(getCategoryLabel('visual')).toBe('Visual/Banner')
      expect(getCategoryLabel('document')).toBe('Document')
    })
  })

  describe('getCategoryDescription', () => {
    it('should return descriptions for all categories', () => {
      const categories = Object.keys(ASSET_CATEGORY_LABELS) as SponsorAssetCategory[]
      for (const category of categories) {
        const description = getCategoryDescription(category)
        expect(description).toBeTruthy()
        expect(typeof description).toBe('string')
      }
    })
  })

  describe('isLogoCategory', () => {
    it('should return true for logo categories', () => {
      expect(isLogoCategory('logo_color')).toBe(true)
      expect(isLogoCategory('logo_mono')).toBe(true)
      expect(isLogoCategory('logo_light')).toBe(true)
      expect(isLogoCategory('logo_dark')).toBe(true)
    })

    it('should return false for non-logo categories', () => {
      expect(isLogoCategory('visual')).toBe(false)
      expect(isLogoCategory('document')).toBe(false)
    })
  })

  describe('isImageMimeType', () => {
    it('should return true for image MIME types', () => {
      expect(isImageMimeType('image/jpeg')).toBe(true)
      expect(isImageMimeType('image/png')).toBe(true)
      expect(isImageMimeType('image/gif')).toBe(true)
      expect(isImageMimeType('image/webp')).toBe(true)
      expect(isImageMimeType('image/svg+xml')).toBe(true)
    })

    it('should return false for non-image MIME types', () => {
      expect(isImageMimeType('application/pdf')).toBe(false)
      expect(isImageMimeType('text/plain')).toBe(false)
    })
  })

  describe('isDocumentMimeType', () => {
    it('should return true for document MIME types', () => {
      expect(isDocumentMimeType('application/pdf')).toBe(true)
      expect(isDocumentMimeType('application/illustrator')).toBe(true)
      expect(isDocumentMimeType('application/postscript')).toBe(true)
      expect(isDocumentMimeType('image/vnd.adobe.photoshop')).toBe(true)
    })

    it('should return false for image MIME types', () => {
      expect(isDocumentMimeType('image/png')).toBe(false)
      expect(isDocumentMimeType('image/jpeg')).toBe(false)
    })
  })

  describe('formatFileSize', () => {
    it('should format zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(5242880)).toBe('5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
    })
  })

  describe('formatDimensions', () => {
    it('should format valid dimensions', () => {
      expect(formatDimensions(800, 600)).toBe('800 x 600 px')
      expect(formatDimensions(1920, 1080)).toBe('1920 x 1080 px')
    })

    it('should return null for missing width', () => {
      expect(formatDimensions(undefined, 600)).toBeNull()
    })

    it('should return null for missing height', () => {
      expect(formatDimensions(800, undefined)).toBeNull()
    })

    it('should return null for both missing', () => {
      expect(formatDimensions(undefined, undefined)).toBeNull()
    })
  })

  describe('groupAssetsByCategory', () => {
    it('should group assets by category', () => {
      const assets: SponsorAsset[] = [
        { ...validAsset, id: '1', category: 'logo_color' },
        { ...validAsset, id: '2', category: 'logo_color' },
        { ...validAsset, id: '3', category: 'document' },
        { ...validAsset, id: '4', category: 'visual' }
      ]

      const grouped = groupAssetsByCategory(assets)

      expect(grouped.logo_color).toHaveLength(2)
      expect(grouped.document).toHaveLength(1)
      expect(grouped.visual).toHaveLength(1)
      expect(grouped.logo_mono).toHaveLength(0)
    })

    it('should return empty arrays for missing categories', () => {
      const grouped = groupAssetsByCategory([])

      for (const category of Object.keys(ASSET_CATEGORY_LABELS) as SponsorAssetCategory[]) {
        expect(grouped[category]).toHaveLength(0)
      }
    })
  })

  describe('getLogoAssets', () => {
    it('should return only logo assets', () => {
      const assets: SponsorAsset[] = [
        { ...validAsset, id: '1', category: 'logo_color' },
        { ...validAsset, id: '2', category: 'logo_dark' },
        { ...validAsset, id: '3', category: 'document' },
        { ...validAsset, id: '4', category: 'visual' }
      ]

      const logos = getLogoAssets(assets)

      expect(logos).toHaveLength(2)
      expect(logos.every((a) => LOGO_CATEGORIES.includes(a.category))).toBe(true)
    })
  })

  describe('getAssetCountByCategory', () => {
    it('should count assets per category', () => {
      const assets: SponsorAsset[] = [
        { ...validAsset, id: '1', category: 'logo_color' },
        { ...validAsset, id: '2', category: 'logo_color' },
        { ...validAsset, id: '3', category: 'document' }
      ]

      const counts = getAssetCountByCategory(assets)

      expect(counts.logo_color).toBe(2)
      expect(counts.document).toBe(1)
      expect(counts.visual).toBe(0)
    })
  })

  describe('Constants', () => {
    it('should have correct max file size', () => {
      expect(MAX_FILE_SIZE_MB).toBe(50)
      expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024)
    })

    it('should have all logo categories', () => {
      expect(LOGO_CATEGORIES).toContain('logo_color')
      expect(LOGO_CATEGORIES).toContain('logo_mono')
      expect(LOGO_CATEGORIES).toContain('logo_light')
      expect(LOGO_CATEGORIES).toContain('logo_dark')
      expect(LOGO_CATEGORIES).toHaveLength(4)
    })
  })
})
