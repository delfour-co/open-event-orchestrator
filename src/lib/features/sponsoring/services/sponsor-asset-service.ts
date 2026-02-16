import type PocketBase from 'pocketbase'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  type SponsorAsset,
  type SponsorAssetCategory,
  isImageMimeType
} from '../domain/sponsor-asset'
import { createSponsorAssetRepository } from '../infra/sponsor-asset-repository'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface UploadAssetData {
  editionSponsorId: string
  category: SponsorAssetCategory
  name: string
  description?: string
  usage?: string
}

export interface ImageDimensions {
  width: number
  height: number
}

const EXTENSION_TO_MIME: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml'],
  '.pdf': ['application/pdf'],
  '.ai': ['application/illustrator', 'application/postscript'],
  '.eps': ['application/postscript'],
  '.psd': ['image/vnd.adobe.photoshop']
}

export const createSponsorAssetService = (pb: PocketBase) => {
  const assetRepo = createSponsorAssetRepository(pb)

  return {
    validateFile(file: File): FileValidationResult {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
          valid: false,
          error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`
        }
      }

      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        return {
          valid: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, PDF, AI, EPS, PSD'
        }
      }

      const extension = getFileExtension(file.name)
      if (!validateExtensionMatchesMime(extension, file.type)) {
        return {
          valid: false,
          error: 'File extension does not match file content'
        }
      }

      return { valid: true }
    },

    async uploadAsset(data: UploadAssetData, file: File): Promise<SponsorAsset> {
      const validation = this.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      let dimensions: ImageDimensions | undefined
      if (isImageMimeType(file.type) && file.type !== 'image/svg+xml') {
        dimensions = await this.getImageDimensions(file)
      }

      return assetRepo.create(
        {
          editionSponsorId: data.editionSponsorId,
          category: data.category,
          name: data.name,
          description: data.description,
          file: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          usage: data.usage
        },
        file
      )
    },

    async getImageDimensions(file: File): Promise<ImageDimensions> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          URL.revokeObjectURL(url)
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image'))
        }

        img.src = url
      })
    },

    async getAssetsByEditionSponsor(editionSponsorId: string): Promise<SponsorAsset[]> {
      return assetRepo.findByEditionSponsor(editionSponsorId)
    },

    async getAssetsByCategory(
      editionSponsorId: string,
      category: SponsorAssetCategory
    ): Promise<SponsorAsset[]> {
      return assetRepo.findByEditionSponsorAndCategory(editionSponsorId, category)
    },

    async getAssetById(id: string): Promise<SponsorAsset | null> {
      return assetRepo.findById(id)
    },

    async updateAsset(
      id: string,
      data: { name?: string; description?: string; category?: SponsorAssetCategory; usage?: string }
    ): Promise<SponsorAsset> {
      return assetRepo.update(id, data)
    },

    async deleteAsset(id: string): Promise<void> {
      return assetRepo.delete(id)
    },

    getFileUrl(asset: SponsorAsset): string {
      return assetRepo.getFileUrl(asset)
    },

    getThumbUrl(asset: SponsorAsset, size: '100x100' | '200x200' | '400x400' = '200x200'): string {
      return assetRepo.getThumbUrl(asset, size)
    },

    async getFileBlob(asset: SponsorAsset): Promise<Blob> {
      return assetRepo.getFileBlob(asset)
    }
  }
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot).toLowerCase()
}

function validateExtensionMatchesMime(extension: string, mimeType: string): boolean {
  const allowedMimes = EXTENSION_TO_MIME[extension]
  if (!allowedMimes) return false
  return allowedMimes.includes(mimeType)
}

export type SponsorAssetService = ReturnType<typeof createSponsorAssetService>
