/**
 * File upload validation utilities.
 * Validates file type, extension, and size for security.
 */

// Allowed MIME types for different upload contexts
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
])

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
])

// Allowed extensions mapped to MIME types
const EXTENSION_TO_MIME: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml'],
  '.pdf': ['application/pdf']
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a file for image uploads (logos, avatars, etc.)
 */
export function validateImageFile(
  file: File,
  options: { maxSizeMB?: number } = {}
): FileValidationResult {
  const maxSize = (options.maxSizeMB || 5) * 1024 * 1024

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${options.maxSizeMB || 5}MB limit`
    }
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG'
    }
  }

  // Check extension matches MIME type
  const extension = getFileExtension(file.name)
  if (!validateExtensionMatchesMime(extension, file.type)) {
    return {
      valid: false,
      error: 'File extension does not match file content'
    }
  }

  return { valid: true }
}

/**
 * Validates a file for document uploads (receipts, invoices, etc.)
 */
export function validateDocumentFile(
  file: File,
  options: { maxSizeMB?: number } = {}
): FileValidationResult {
  const maxSize = (options.maxSizeMB || 10) * 1024 * 1024

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${options.maxSizeMB || 10}MB limit`
    }
  }

  // Check MIME type
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed types: PDF, JPEG, PNG, GIF, WebP'
    }
  }

  // Check extension matches MIME type
  const extension = getFileExtension(file.name)
  if (!validateExtensionMatchesMime(extension, file.type)) {
    return {
      valid: false,
      error: 'File extension does not match file content'
    }
  }

  return { valid: true }
}

/**
 * Gets the lowercase file extension including the dot.
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.slice(lastDot).toLowerCase()
}

/**
 * Validates that the file extension matches the declared MIME type.
 */
function validateExtensionMatchesMime(extension: string, mimeType: string): boolean {
  const allowedMimes = EXTENSION_TO_MIME[extension]
  if (!allowedMimes) return false
  return allowedMimes.includes(mimeType)
}
