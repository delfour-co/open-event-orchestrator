import { z } from 'zod'

export const sponsorAssetCategorySchema = z.enum([
  'logo_color',
  'logo_mono',
  'logo_light',
  'logo_dark',
  'visual',
  'document'
])

export type SponsorAssetCategory = z.infer<typeof sponsorAssetCategorySchema>

export const sponsorAssetSchema = z.object({
  id: z.string(),
  editionSponsorId: z.string(),
  category: sponsorAssetCategorySchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  file: z.string(),
  fileSize: z.number().int().min(0),
  mimeType: z.string().max(100),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
  usage: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SponsorAsset = z.infer<typeof sponsorAssetSchema>

export const createSponsorAssetSchema = sponsorAssetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSponsorAsset = z.infer<typeof createSponsorAssetSchema>

export const updateSponsorAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: sponsorAssetCategorySchema.optional(),
  usage: z.string().max(500).optional()
})

export type UpdateSponsorAsset = z.infer<typeof updateSponsorAssetSchema>

export interface SponsorAssetWithUrl extends SponsorAsset {
  fileUrl: string
  thumbUrl?: string
}

export const ASSET_CATEGORY_LABELS: Record<SponsorAssetCategory, string> = {
  logo_color: 'Logo (Color)',
  logo_mono: 'Logo (Monochrome)',
  logo_light: 'Logo (Light Background)',
  logo_dark: 'Logo (Dark Background)',
  visual: 'Visual/Banner',
  document: 'Document'
}

export const ASSET_CATEGORY_DESCRIPTIONS: Record<SponsorAssetCategory, string> = {
  logo_color: 'Full color version of your logo',
  logo_mono: 'Single color or black/white version',
  logo_light: 'Version optimized for light backgrounds',
  logo_dark: 'Version optimized for dark backgrounds',
  visual: 'Banners, promotional images, or visuals',
  document: 'PDF documents, press kits, etc.'
}

export const LOGO_CATEGORIES: SponsorAssetCategory[] = [
  'logo_color',
  'logo_mono',
  'logo_light',
  'logo_dark'
]

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
] as const

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/illustrator',
  'application/postscript',
  'image/vnd.adobe.photoshop'
] as const

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES
] as const

export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const getCategoryLabel = (category: SponsorAssetCategory): string => {
  return ASSET_CATEGORY_LABELS[category]
}

export const getCategoryDescription = (category: SponsorAssetCategory): string => {
  return ASSET_CATEGORY_DESCRIPTIONS[category]
}

export const isLogoCategory = (category: SponsorAssetCategory): boolean => {
  return LOGO_CATEGORIES.includes(category)
}

export const isImageMimeType = (mimeType: string): boolean => {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
}

export const isDocumentMimeType = (mimeType: string): boolean => {
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export const formatDimensions = (width?: number, height?: number): string | null => {
  if (!width || !height) return null
  return `${width} x ${height} px`
}

export const groupAssetsByCategory = <T extends SponsorAsset>(
  assets: T[]
): Record<SponsorAssetCategory, T[]> => {
  const groups: Record<SponsorAssetCategory, T[]> = {
    logo_color: [],
    logo_mono: [],
    logo_light: [],
    logo_dark: [],
    visual: [],
    document: []
  }

  for (const asset of assets) {
    groups[asset.category].push(asset)
  }

  return groups
}

export const getLogoAssets = (assets: SponsorAsset[]): SponsorAsset[] => {
  return assets.filter((a) => isLogoCategory(a.category))
}

export const getAssetCountByCategory = (
  assets: SponsorAsset[]
): Record<SponsorAssetCategory, number> => {
  const counts: Record<SponsorAssetCategory, number> = {
    logo_color: 0,
    logo_mono: 0,
    logo_light: 0,
    logo_dark: 0,
    visual: 0,
    document: 0
  }

  for (const asset of assets) {
    counts[asset.category]++
  }

  return counts
}
