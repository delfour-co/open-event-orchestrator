/**
 * Speaker Photo Export Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type ExportFilter,
  type ExportSpeakerInfo,
  type ImageFormat,
  type ImageSize,
  type PhotoExportEntry,
  type PhotoExportOptions,
  createExportEntry,
  createExportManifest,
  createExportSummary,
  estimateExportSize,
  filterSpeakersForExport,
  formatEstimatedSize,
  formatFileSize,
  formatManifestAsJson,
  formatManifestAsText,
  generatePhotoFilename,
  generateUniqueFilename,
  generateZipFilename,
  getExportStatusColor,
  getExportStatusLabel,
  getExportWarnings,
  getExtensionFromUrl,
  getFilterLabel,
  getFormatLabel,
  getImageDimensions,
  getSizeLabel,
  getSpeakersWithMissingPhotos,
  getSpeakersWithPhotos,
  isValidImageUrl,
  sanitizeForFilename,
  speakerMatchesFilter,
  validateExportOptions
} from './speaker-photo-export'

// Test fixtures
const createSpeaker = (overrides?: Partial<ExportSpeakerInfo>): ExportSpeakerInfo => ({
  id: 'speaker-001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  photoUrl: 'https://example.com/photos/john-doe.jpg',
  company: 'Tech Corp',
  talks: [{ id: 'talk-001', title: 'Introduction to TypeScript', status: 'accepted' }],
  ...overrides
})

const createOptions = (overrides?: Partial<PhotoExportOptions>): PhotoExportOptions => ({
  size: 'original',
  filter: 'accepted',
  format: 'jpg',
  cropSquare: false,
  includeManifest: true,
  ...overrides
})

describe('Filename Generation', () => {
  describe('sanitizeForFilename', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeForFilename('JohnDOE')).toBe('johndoe')
    })

    it('should remove diacritics', () => {
      expect(sanitizeForFilename('Émilie')).toBe('emilie')
      expect(sanitizeForFilename('François')).toBe('francois')
      expect(sanitizeForFilename('Müller')).toBe('muller')
    })

    it('should replace spaces with dashes', () => {
      expect(sanitizeForFilename('John Doe')).toBe('john-doe')
    })

    it('should collapse multiple dashes', () => {
      expect(sanitizeForFilename('John---Doe')).toBe('john-doe')
    })

    it('should remove leading and trailing dashes', () => {
      expect(sanitizeForFilename('-John Doe-')).toBe('john-doe')
    })

    it('should handle special characters', () => {
      expect(sanitizeForFilename("John O'Brien")).toBe('john-o-brien')
      expect(sanitizeForFilename('Jean-Pierre')).toBe('jean-pierre')
    })
  })

  describe('generatePhotoFilename', () => {
    it('should generate basic filename', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      expect(generatePhotoFilename(speaker, 'jpg')).toBe('john-doe.jpg')
    })

    it('should support different formats', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      expect(generatePhotoFilename(speaker, 'png')).toBe('john-doe.png')
      expect(generatePhotoFilename(speaker, 'webp')).toBe('john-doe.webp')
    })

    it('should include index when specified', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      expect(generatePhotoFilename(speaker, 'jpg', { includeIndex: 2 })).toBe('john-doe-2.jpg')
    })

    it('should include suffix when specified', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      expect(generatePhotoFilename(speaker, 'jpg', { suffix: '800px' })).toBe('john-doe-800px.jpg')
    })

    it('should handle names with diacritics', () => {
      const speaker = { firstName: 'Émilie', lastName: 'Müller' }
      expect(generatePhotoFilename(speaker, 'jpg')).toBe('emilie-muller.jpg')
    })
  })

  describe('generateUniqueFilename', () => {
    it('should return basic filename when not duplicate', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      const existing = new Set<string>()
      expect(generateUniqueFilename(speaker, 'jpg', existing)).toBe('john-doe.jpg')
    })

    it('should add index for duplicate names', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      const existing = new Set(['john-doe.jpg'])
      expect(generateUniqueFilename(speaker, 'jpg', existing)).toBe('john-doe-2.jpg')
    })

    it('should increment index for multiple duplicates', () => {
      const speaker = { firstName: 'John', lastName: 'Doe' }
      const existing = new Set(['john-doe.jpg', 'john-doe-2.jpg', 'john-doe-3.jpg'])
      expect(generateUniqueFilename(speaker, 'jpg', existing)).toBe('john-doe-4.jpg')
    })
  })

  describe('generateZipFilename', () => {
    it('should include edition slug', () => {
      const options = createOptions()
      const filename = generateZipFilename('conf-2025', options)
      expect(filename).toContain('conf-2025')
      expect(filename).toContain('speakers-photos')
      expect(filename).toMatch(/\.zip$/)
    })

    it('should include filter for non-all filter', () => {
      const options = createOptions({ filter: 'confirmed' })
      const filename = generateZipFilename('conf-2025', options)
      expect(filename).toContain('confirmed')
    })

    it('should not include filter for all', () => {
      const options = createOptions({ filter: 'all' })
      const filename = generateZipFilename('conf-2025', options)
      expect(filename).not.toContain('all')
    })

    it('should include size for non-original size', () => {
      const options = createOptions({ size: '800' })
      const filename = generateZipFilename('conf-2025', options)
      expect(filename).toContain('800px')
    })

    it('should include square indicator', () => {
      const options = createOptions({ cropSquare: true })
      const filename = generateZipFilename('conf-2025', options)
      expect(filename).toContain('square')
    })
  })
})

describe('Filtering Functions', () => {
  describe('speakerMatchesFilter', () => {
    it('should match all speakers for "all" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'pending' }] })
      expect(speakerMatchesFilter(speaker, 'all')).toBe(true)
    })

    it('should match accepted speakers for "accepted" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'accepted' }] })
      expect(speakerMatchesFilter(speaker, 'accepted')).toBe(true)
    })

    it('should match confirmed speakers for "accepted" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'confirmed' }] })
      expect(speakerMatchesFilter(speaker, 'accepted')).toBe(true)
    })

    it('should not match pending speakers for "accepted" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'pending' }] })
      expect(speakerMatchesFilter(speaker, 'accepted')).toBe(false)
    })

    it('should match confirmed speakers for "confirmed" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'confirmed' }] })
      expect(speakerMatchesFilter(speaker, 'confirmed')).toBe(true)
    })

    it('should not match accepted speakers for "confirmed" filter', () => {
      const speaker = createSpeaker({ talks: [{ id: '1', title: 'Talk', status: 'accepted' }] })
      expect(speakerMatchesFilter(speaker, 'confirmed')).toBe(false)
    })

    it('should match if any talk matches the filter', () => {
      const speaker = createSpeaker({
        talks: [
          { id: '1', title: 'Talk 1', status: 'rejected' },
          { id: '2', title: 'Talk 2', status: 'accepted' }
        ]
      })
      expect(speakerMatchesFilter(speaker, 'accepted')).toBe(true)
    })
  })

  describe('filterSpeakersForExport', () => {
    it('should filter speakers based on status', () => {
      const speakers = [
        createSpeaker({
          id: '1',
          talks: [{ id: 't1', title: 'Talk', status: 'accepted' }]
        }),
        createSpeaker({
          id: '2',
          talks: [{ id: 't2', title: 'Talk', status: 'rejected' }]
        }),
        createSpeaker({
          id: '3',
          talks: [{ id: 't3', title: 'Talk', status: 'confirmed' }]
        })
      ]

      const filtered = filterSpeakersForExport(speakers, 'accepted')
      expect(filtered).toHaveLength(2)
      expect(filtered.map((s) => s.id)).toEqual(['1', '3'])
    })
  })

  describe('getSpeakersWithMissingPhotos', () => {
    it('should return speakers without photos', () => {
      const speakers = [
        createSpeaker({ id: '1', photoUrl: 'https://example.com/photo.jpg' }),
        createSpeaker({ id: '2', photoUrl: undefined }),
        createSpeaker({ id: '3', photoUrl: 'https://example.com/photo2.jpg' })
      ]

      const missing = getSpeakersWithMissingPhotos(speakers)
      expect(missing).toHaveLength(1)
      expect(missing[0].id).toBe('2')
    })
  })

  describe('getSpeakersWithPhotos', () => {
    it('should return speakers with photos', () => {
      const speakers = [
        createSpeaker({ id: '1', photoUrl: 'https://example.com/photo.jpg' }),
        createSpeaker({ id: '2', photoUrl: undefined }),
        createSpeaker({ id: '3', photoUrl: 'https://example.com/photo2.jpg' })
      ]

      const withPhotos = getSpeakersWithPhotos(speakers)
      expect(withPhotos).toHaveLength(2)
      expect(withPhotos.map((s) => s.id)).toEqual(['1', '3'])
    })
  })
})

describe('Manifest Functions', () => {
  describe('createExportEntry', () => {
    it('should create success entry', () => {
      const speaker = createSpeaker()
      const entry = createExportEntry(speaker, 'john-doe.jpg', 'success', { fileSize: 50000 })

      expect(entry.speakerId).toBe('speaker-001')
      expect(entry.speakerName).toBe('John Doe')
      expect(entry.filename).toBe('john-doe.jpg')
      expect(entry.status).toBe('success')
      expect(entry.fileSize).toBe(50000)
    })

    it('should create missing entry', () => {
      const speaker = createSpeaker({ photoUrl: undefined })
      const entry = createExportEntry(speaker, 'john-doe.jpg', 'missing')

      expect(entry.status).toBe('missing')
      expect(entry.originalUrl).toBeUndefined()
    })

    it('should create error entry with message', () => {
      const speaker = createSpeaker()
      const entry = createExportEntry(speaker, 'john-doe.jpg', 'error', {
        errorMessage: 'Network error'
      })

      expect(entry.status).toBe('error')
      expect(entry.errorMessage).toBe('Network error')
    })
  })

  describe('createExportManifest', () => {
    it('should create manifest with correct counts', () => {
      const entries: PhotoExportEntry[] = [
        {
          speakerId: '1',
          speakerName: 'John Doe',
          filename: 'john-doe.jpg',
          status: 'success'
        },
        {
          speakerId: '2',
          speakerName: 'Jane Smith',
          filename: 'jane-smith.jpg',
          status: 'success'
        },
        {
          speakerId: '3',
          speakerName: 'Bob Wilson',
          filename: 'bob-wilson.jpg',
          status: 'missing'
        },
        {
          speakerId: '4',
          speakerName: 'Alice Brown',
          filename: 'alice-brown.jpg',
          status: 'error'
        }
      ]

      const manifest = createExportManifest(
        'edition-001',
        'Tech Conf 2025',
        createOptions(),
        entries
      )

      expect(manifest.totalSpeakers).toBe(4)
      expect(manifest.photosExported).toBe(2)
      expect(manifest.photosMissing).toBe(1)
      expect(manifest.photosError).toBe(1)
    })
  })

  describe('formatManifestAsText', () => {
    it('should format manifest as readable text', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [
        { speakerId: '1', speakerName: 'John Doe', filename: 'john-doe.jpg', status: 'success' },
        { speakerId: '2', speakerName: 'Jane Smith', filename: 'jane-smith.jpg', status: 'missing' }
      ])

      const text = formatManifestAsText(manifest)

      expect(text).toContain('# Speaker Photo Export Manifest')
      expect(text).toContain('Tech Conf 2025')
      expect(text).toContain('Total Speakers: 2')
      expect(text).toContain('Photos Exported: 1')
      expect(text).toContain('Jane Smith')
    })
  })

  describe('formatManifestAsJson', () => {
    it('should format manifest as JSON', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [])

      const json = formatManifestAsJson(manifest)
      const parsed = JSON.parse(json)

      expect(parsed.editionId).toBe('edition-001')
      expect(parsed.editionName).toBe('Tech Conf 2025')
    })
  })
})

describe('Utility Functions', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1500)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1500000)).toBe('1.4 MB')
    })
  })

  describe('getImageDimensions', () => {
    it('should return null for original', () => {
      expect(getImageDimensions('original')).toBeNull()
    })

    it('should return correct dimensions', () => {
      expect(getImageDimensions('800')).toBe(800)
      expect(getImageDimensions('400')).toBe(400)
      expect(getImageDimensions('200')).toBe(200)
    })
  })

  describe('isValidImageUrl', () => {
    it('should validate URLs with image extensions', () => {
      expect(isValidImageUrl('https://example.com/photo.jpg')).toBe(true)
      expect(isValidImageUrl('https://example.com/photo.png')).toBe(true)
      expect(isValidImageUrl('https://example.com/photo.webp')).toBe(true)
    })

    it('should validate known image services', () => {
      expect(isValidImageUrl('https://pocketbase.io/api/files/user/123/photo')).toBe(true)
      expect(isValidImageUrl('https://res.cloudinary.com/demo/image/upload/sample')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false)
      expect(isValidImageUrl('ftp://example.com/photo.jpg')).toBe(true) // has valid extension
    })
  })

  describe('getExtensionFromUrl', () => {
    it('should extract extension', () => {
      expect(getExtensionFromUrl('https://example.com/photo.jpg')).toBe('jpg')
      expect(getExtensionFromUrl('https://example.com/photo.PNG')).toBe('png')
    })

    it('should return null for URLs without extension', () => {
      expect(getExtensionFromUrl('https://example.com/photo')).toBeNull()
    })

    it('should return null for invalid URLs', () => {
      expect(getExtensionFromUrl('not-a-url')).toBeNull()
    })
  })

  describe('estimateExportSize', () => {
    it('should estimate size based on count and options', () => {
      const size = estimateExportSize(10, 'original', 'jpg')
      expect(size).toBe(5000000) // 10 * 500KB
    })

    it('should estimate smaller size for smaller images', () => {
      const original = estimateExportSize(10, 'original', 'jpg')
      const small = estimateExportSize(10, '400', 'jpg')
      expect(small).toBeLessThan(original)
    })
  })

  describe('formatEstimatedSize', () => {
    it('should format estimated size', () => {
      const formatted = formatEstimatedSize(10, 'original', 'jpg')
      expect(formatted).toContain('~')
      expect(formatted).toContain('MB')
    })
  })
})

describe('Display Functions', () => {
  describe('getSizeLabel', () => {
    it('should return correct labels', () => {
      expect(getSizeLabel('original')).toBe('Original')
      expect(getSizeLabel('800')).toBe('800px')
      expect(getSizeLabel('400')).toBe('400px')
      expect(getSizeLabel('200')).toBe('200px')
    })
  })

  describe('getFilterLabel', () => {
    it('should return correct labels', () => {
      expect(getFilterLabel('all')).toBe('All Speakers')
      expect(getFilterLabel('accepted')).toBe('Accepted Speakers')
      expect(getFilterLabel('confirmed')).toBe('Confirmed Speakers')
    })
  })

  describe('getFormatLabel', () => {
    it('should return correct labels', () => {
      expect(getFormatLabel('jpg')).toBe('JPEG')
      expect(getFormatLabel('png')).toBe('PNG')
      expect(getFormatLabel('webp')).toBe('WebP')
    })
  })

  describe('getExportStatusColor', () => {
    it('should return correct colors', () => {
      expect(getExportStatusColor('success')).toBe('green')
      expect(getExportStatusColor('missing')).toBe('yellow')
      expect(getExportStatusColor('error')).toBe('red')
    })
  })

  describe('getExportStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getExportStatusLabel('success')).toBe('Exported')
      expect(getExportStatusLabel('missing')).toBe('No Photo')
      expect(getExportStatusLabel('error')).toBe('Error')
    })
  })
})

describe('Export Summary Functions', () => {
  describe('createExportSummary', () => {
    it('should calculate correct summary', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [
        { speakerId: '1', speakerName: 'John Doe', filename: 'john-doe.jpg', status: 'success' },
        {
          speakerId: '2',
          speakerName: 'Jane Smith',
          filename: 'jane-smith.jpg',
          status: 'success'
        },
        {
          speakerId: '3',
          speakerName: 'Bob Wilson',
          filename: 'bob-wilson.jpg',
          status: 'missing'
        },
        { speakerId: '4', speakerName: 'Alice Brown', filename: 'alice-brown.jpg', status: 'error' }
      ])

      const summary = createExportSummary(manifest)

      expect(summary.total).toBe(4)
      expect(summary.exported).toBe(2)
      expect(summary.missing).toBe(1)
      expect(summary.errors).toBe(1)
      expect(summary.successRate).toBe(50)
    })

    it('should handle empty manifest', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [])
      const summary = createExportSummary(manifest)

      expect(summary.total).toBe(0)
      expect(summary.successRate).toBe(0)
    })
  })

  describe('getExportWarnings', () => {
    it('should return warnings for missing photos', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [
        { speakerId: '1', speakerName: 'John Doe', filename: 'john-doe.jpg', status: 'missing' }
      ])

      const warnings = getExportWarnings(manifest)

      expect(warnings).toHaveLength(2)
      expect(warnings[0]).toContain('1 speaker(s) have no photo')
      expect(warnings[1]).toContain('No photos were exported')
    })

    it('should return warnings for errors', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [
        { speakerId: '1', speakerName: 'John Doe', filename: 'john-doe.jpg', status: 'error' }
      ])

      const warnings = getExportWarnings(manifest)

      expect(warnings.some((w) => w.includes('could not be exported'))).toBe(true)
    })

    it('should return empty array for successful export', () => {
      const manifest = createExportManifest('edition-001', 'Tech Conf 2025', createOptions(), [
        { speakerId: '1', speakerName: 'John Doe', filename: 'john-doe.jpg', status: 'success' }
      ])

      const warnings = getExportWarnings(manifest)

      expect(warnings).toHaveLength(0)
    })
  })
})

describe('Validation Functions', () => {
  describe('validateExportOptions', () => {
    it('should validate correct options', () => {
      const options = validateExportOptions({
        size: '800',
        filter: 'accepted',
        format: 'png',
        cropSquare: true,
        includeManifest: false
      })

      expect(options.size).toBe('800')
      expect(options.filter).toBe('accepted')
      expect(options.format).toBe('png')
      expect(options.cropSquare).toBe(true)
      expect(options.includeManifest).toBe(false)
    })

    it('should apply defaults for missing options', () => {
      const options = validateExportOptions({})

      expect(options.size).toBe('original')
      expect(options.filter).toBe('accepted')
      expect(options.format).toBe('jpg')
      expect(options.cropSquare).toBe(false)
      expect(options.includeManifest).toBe(true)
    })

    it('should reject invalid size', () => {
      expect(() =>
        validateExportOptions({
          size: '1000'
        })
      ).toThrow()
    })

    it('should reject invalid filter', () => {
      expect(() =>
        validateExportOptions({
          filter: 'pending'
        })
      ).toThrow()
    })

    it('should reject invalid format', () => {
      expect(() =>
        validateExportOptions({
          format: 'gif'
        })
      ).toThrow()
    })
  })
})
