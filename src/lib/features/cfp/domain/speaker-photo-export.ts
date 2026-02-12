/**
 * Speaker Photo Export Domain
 *
 * Handles bulk export of speaker photos as a ZIP file.
 * Supports filtering by status, resizing options, and standardized naming.
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

/**
 * Available image sizes for export
 */
export const IMAGE_SIZES = ['original', '800', '400', '200'] as const

/**
 * Export filter options by talk status
 */
export const EXPORT_FILTERS = ['all', 'accepted', 'confirmed'] as const

/**
 * Supported image formats
 */
export const IMAGE_FORMATS = ['jpg', 'png', 'webp'] as const

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS = {
  size: 'original' as const,
  filter: 'accepted' as const,
  format: 'jpg' as const,
  cropSquare: false,
  includeManifest: true
}

/**
 * Image size dimensions
 */
export const SIZE_DIMENSIONS: Record<Exclude<ImageSize, 'original'>, number> = {
  '800': 800,
  '400': 400,
  '200': 200
}

// ============================================================================
// Schemas
// ============================================================================

export const imageSizeSchema = z.enum(IMAGE_SIZES)
export type ImageSize = z.infer<typeof imageSizeSchema>

export const exportFilterSchema = z.enum(EXPORT_FILTERS)
export type ExportFilter = z.infer<typeof exportFilterSchema>

export const imageFormatSchema = z.enum(IMAGE_FORMATS)
export type ImageFormat = z.infer<typeof imageFormatSchema>

/**
 * Export options schema
 */
export const photoExportOptionsSchema = z.object({
  size: imageSizeSchema.default('original'),
  filter: exportFilterSchema.default('accepted'),
  format: imageFormatSchema.default('jpg'),
  cropSquare: z.boolean().default(false),
  includeManifest: z.boolean().default(true)
})

export type PhotoExportOptions = z.infer<typeof photoExportOptionsSchema>

/**
 * Speaker info for export
 */
export const exportSpeakerInfoSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  photoUrl: z.string().url().optional(),
  company: z.string().optional(),
  talks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string()
    })
  )
})

export type ExportSpeakerInfo = z.infer<typeof exportSpeakerInfoSchema>

/**
 * Photo export entry
 */
export const photoExportEntrySchema = z.object({
  speakerId: z.string(),
  speakerName: z.string(),
  originalUrl: z.string().url().optional(),
  filename: z.string(),
  status: z.enum(['success', 'missing', 'error']),
  errorMessage: z.string().optional(),
  fileSize: z.number().optional()
})

export type PhotoExportEntry = z.infer<typeof photoExportEntrySchema>

/**
 * Export manifest
 */
export const exportManifestSchema = z.object({
  editionId: z.string(),
  editionName: z.string(),
  exportedAt: z.date(),
  options: photoExportOptionsSchema,
  totalSpeakers: z.number().int().min(0),
  photosExported: z.number().int().min(0),
  photosMissing: z.number().int().min(0),
  photosError: z.number().int().min(0),
  entries: z.array(photoExportEntrySchema)
})

export type ExportManifest = z.infer<typeof exportManifestSchema>

/**
 * Export result
 */
export const photoExportResultSchema = z.object({
  success: z.boolean(),
  zipFilename: z.string(),
  zipSize: z.number().optional(),
  manifest: exportManifestSchema,
  error: z.string().optional()
})

export type PhotoExportResult = z.infer<typeof photoExportResultSchema>

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate export options
 */
export function validateExportOptions(data: unknown): PhotoExportOptions {
  return photoExportOptionsSchema.parse(data)
}

/**
 * Validate speaker info for export
 */
export function validateExportSpeakerInfo(data: unknown): ExportSpeakerInfo {
  return exportSpeakerInfoSchema.parse(data)
}

/**
 * Validate export manifest
 */
export function validateExportManifest(data: unknown): ExportManifest {
  return exportManifestSchema.parse(data)
}

// ============================================================================
// Filename Generation
// ============================================================================

/**
 * Sanitize text for use in filename
 */
export function sanitizeForFilename(text: string): string {
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: Standard regex for removing combining diacritical marks
  const diacriticsRegex = /[\u0300-\u036f]/g
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(diacriticsRegex, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with dash
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
}

/**
 * Generate standardized filename for speaker photo
 */
export function generatePhotoFilename(
  speaker: Pick<ExportSpeakerInfo, 'firstName' | 'lastName'>,
  format: ImageFormat = 'jpg',
  options?: { suffix?: string; includeIndex?: number }
): string {
  const firstName = sanitizeForFilename(speaker.firstName)
  const lastName = sanitizeForFilename(speaker.lastName)

  let filename = `${firstName}-${lastName}`

  if (options?.includeIndex !== undefined) {
    filename += `-${options.includeIndex}`
  }

  if (options?.suffix) {
    filename += `-${sanitizeForFilename(options.suffix)}`
  }

  return `${filename}.${format}`
}

/**
 * Generate unique filename handling duplicates
 */
export function generateUniqueFilename(
  speaker: Pick<ExportSpeakerInfo, 'firstName' | 'lastName'>,
  format: ImageFormat,
  existingFilenames: Set<string>
): string {
  let filename = generatePhotoFilename(speaker, format)

  if (!existingFilenames.has(filename)) {
    return filename
  }

  // Handle duplicates by adding index
  let index = 2
  while (existingFilenames.has(filename)) {
    filename = generatePhotoFilename(speaker, format, { includeIndex: index })
    index++
  }

  return filename
}

/**
 * Generate ZIP filename
 */
export function generateZipFilename(editionSlug: string, options: PhotoExportOptions): string {
  const parts = ['speakers-photos', editionSlug]

  if (options.filter !== 'all') {
    parts.push(options.filter)
  }

  if (options.size !== 'original') {
    parts.push(`${options.size}px`)
  }

  if (options.cropSquare) {
    parts.push('square')
  }

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  parts.push(timestamp)

  return `${parts.join('-')}.zip`
}

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Check if speaker matches export filter
 */
export function speakerMatchesFilter(speaker: ExportSpeakerInfo, filter: ExportFilter): boolean {
  if (filter === 'all') {
    return true
  }

  // Speaker matches if any of their talks has the required status
  return speaker.talks.some((talk) => {
    if (filter === 'accepted') {
      return talk.status === 'accepted' || talk.status === 'confirmed'
    }
    if (filter === 'confirmed') {
      return talk.status === 'confirmed'
    }
    return false
  })
}

/**
 * Filter speakers by export options
 */
export function filterSpeakersForExport(
  speakers: ExportSpeakerInfo[],
  filter: ExportFilter
): ExportSpeakerInfo[] {
  return speakers.filter((speaker) => speakerMatchesFilter(speaker, filter))
}

/**
 * Get speakers with missing photos
 */
export function getSpeakersWithMissingPhotos(speakers: ExportSpeakerInfo[]): ExportSpeakerInfo[] {
  return speakers.filter((speaker) => !speaker.photoUrl)
}

/**
 * Get speakers with photos
 */
export function getSpeakersWithPhotos(speakers: ExportSpeakerInfo[]): ExportSpeakerInfo[] {
  return speakers.filter((speaker) => !!speaker.photoUrl)
}

// ============================================================================
// Manifest Functions
// ============================================================================

/**
 * Create export entry for a speaker
 */
export function createExportEntry(
  speaker: ExportSpeakerInfo,
  filename: string,
  status: PhotoExportEntry['status'],
  options?: { errorMessage?: string; fileSize?: number }
): PhotoExportEntry {
  return {
    speakerId: speaker.id,
    speakerName: `${speaker.firstName} ${speaker.lastName}`,
    originalUrl: speaker.photoUrl,
    filename,
    status,
    errorMessage: options?.errorMessage,
    fileSize: options?.fileSize
  }
}

/**
 * Create export manifest
 */
export function createExportManifest(
  editionId: string,
  editionName: string,
  options: PhotoExportOptions,
  entries: PhotoExportEntry[]
): ExportManifest {
  const photosExported = entries.filter((e) => e.status === 'success').length
  const photosMissing = entries.filter((e) => e.status === 'missing').length
  const photosError = entries.filter((e) => e.status === 'error').length

  return {
    editionId,
    editionName,
    exportedAt: new Date(),
    options,
    totalSpeakers: entries.length,
    photosExported,
    photosMissing,
    photosError,
    entries
  }
}

/**
 * Format manifest as text for inclusion in ZIP
 */
export function formatManifestAsText(manifest: ExportManifest): string {
  const lines: string[] = []

  lines.push('# Speaker Photo Export Manifest')
  lines.push('')
  lines.push(`Edition: ${manifest.editionName}`)
  lines.push(`Exported: ${manifest.exportedAt.toISOString()}`)
  lines.push('')
  lines.push('## Options')
  lines.push(`- Size: ${manifest.options.size}`)
  lines.push(`- Format: ${manifest.options.format}`)
  lines.push(`- Filter: ${manifest.options.filter}`)
  lines.push(`- Crop Square: ${manifest.options.cropSquare ? 'Yes' : 'No'}`)
  lines.push('')
  lines.push('## Summary')
  lines.push(`- Total Speakers: ${manifest.totalSpeakers}`)
  lines.push(`- Photos Exported: ${manifest.photosExported}`)
  lines.push(`- Photos Missing: ${manifest.photosMissing}`)
  lines.push(`- Photos with Errors: ${manifest.photosError}`)
  lines.push('')

  if (manifest.photosMissing > 0) {
    lines.push('## Missing Photos')
    for (const entry of manifest.entries.filter((e) => e.status === 'missing')) {
      lines.push(`- ${entry.speakerName}`)
    }
    lines.push('')
  }

  if (manifest.photosError > 0) {
    lines.push('## Errors')
    for (const entry of manifest.entries.filter((e) => e.status === 'error')) {
      lines.push(`- ${entry.speakerName}: ${entry.errorMessage || 'Unknown error'}`)
    }
    lines.push('')
  }

  if (manifest.photosExported > 0) {
    lines.push('## Exported Files')
    for (const entry of manifest.entries.filter((e) => e.status === 'success')) {
      const size = entry.fileSize ? ` (${formatFileSize(entry.fileSize)})` : ''
      lines.push(`- ${entry.filename}${size}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format manifest as JSON for inclusion in ZIP
 */
export function formatManifestAsJson(manifest: ExportManifest): string {
  return JSON.stringify(manifest, null, 2)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get image dimensions for size option
 */
export function getImageDimensions(size: ImageSize): number | null {
  if (size === 'original') {
    return null
  }
  return SIZE_DIMENSIONS[size]
}

/**
 * Check if URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const pathname = parsed.pathname.toLowerCase()

    // Check if URL has a valid image extension or is a known image service
    return (
      validExtensions.some((ext) => pathname.endsWith(ext)) ||
      parsed.hostname.includes('pocketbase') ||
      parsed.hostname.includes('cloudinary') ||
      parsed.hostname.includes('gravatar') ||
      parsed.hostname.includes('githubusercontent')
    )
  } catch {
    return false
  }
}

/**
 * Get file extension from URL
 */
export function getExtensionFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    const match = pathname.match(/\.([a-z0-9]+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Calculate estimated export size
 */
export function estimateExportSize(
  speakerCount: number,
  size: ImageSize,
  format: ImageFormat
): number {
  // Average file sizes in bytes based on size and format
  const avgSizes: Record<ImageSize, Record<ImageFormat, number>> = {
    original: { jpg: 500000, png: 800000, webp: 400000 }, // 500KB-800KB
    '800': { jpg: 200000, png: 300000, webp: 150000 }, // 150KB-300KB
    '400': { jpg: 80000, png: 120000, webp: 60000 }, // 60KB-120KB
    '200': { jpg: 30000, png: 50000, webp: 25000 } // 25KB-50KB
  }

  return speakerCount * avgSizes[size][format]
}

/**
 * Format estimated size for display
 */
export function formatEstimatedSize(
  speakerCount: number,
  size: ImageSize,
  format: ImageFormat
): string {
  const estimated = estimateExportSize(speakerCount, size, format)
  return `~${formatFileSize(estimated)}`
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get size label for display
 */
export function getSizeLabel(size: ImageSize): string {
  const labels: Record<ImageSize, string> = {
    original: 'Original',
    '800': '800px',
    '400': '400px',
    '200': '200px'
  }
  return labels[size]
}

/**
 * Get filter label for display
 */
export function getFilterLabel(filter: ExportFilter): string {
  const labels: Record<ExportFilter, string> = {
    all: 'All Speakers',
    accepted: 'Accepted Speakers',
    confirmed: 'Confirmed Speakers'
  }
  return labels[filter]
}

/**
 * Get format label for display
 */
export function getFormatLabel(format: ImageFormat): string {
  const labels: Record<ImageFormat, string> = {
    jpg: 'JPEG',
    png: 'PNG',
    webp: 'WebP'
  }
  return labels[format]
}

/**
 * Get export status badge color
 */
export function getExportStatusColor(status: PhotoExportEntry['status']): string {
  const colors: Record<PhotoExportEntry['status'], string> = {
    success: 'green',
    missing: 'yellow',
    error: 'red'
  }
  return colors[status]
}

/**
 * Get export status label
 */
export function getExportStatusLabel(status: PhotoExportEntry['status']): string {
  const labels: Record<PhotoExportEntry['status'], string> = {
    success: 'Exported',
    missing: 'No Photo',
    error: 'Error'
  }
  return labels[status]
}

// ============================================================================
// Export Summary Functions
// ============================================================================

/**
 * Create export summary for display
 */
export function createExportSummary(manifest: ExportManifest): {
  total: number
  exported: number
  missing: number
  errors: number
  successRate: number
} {
  return {
    total: manifest.totalSpeakers,
    exported: manifest.photosExported,
    missing: manifest.photosMissing,
    errors: manifest.photosError,
    successRate:
      manifest.totalSpeakers > 0
        ? Math.round((manifest.photosExported / manifest.totalSpeakers) * 100)
        : 0
  }
}

/**
 * Get warnings for export
 */
export function getExportWarnings(manifest: ExportManifest): string[] {
  const warnings: string[] = []

  if (manifest.photosMissing > 0) {
    warnings.push(`${manifest.photosMissing} speaker(s) have no photo and will be skipped`)
  }

  if (manifest.photosError > 0) {
    warnings.push(`${manifest.photosError} photo(s) could not be exported due to errors`)
  }

  if (manifest.photosExported === 0) {
    warnings.push('No photos were exported')
  }

  return warnings
}
