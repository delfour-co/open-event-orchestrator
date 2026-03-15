import { describe, expect, it } from 'vitest'
import { validateDocumentFile, validateImageFile } from './file-validation'

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

describe('file-validation', () => {
  describe('validateImageFile', () => {
    it('should accept a valid JPEG image', () => {
      const file = createMockFile('photo.jpg', 1024, 'image/jpeg')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept a valid PNG image', () => {
      const file = createMockFile('image.png', 2048, 'image/png')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept a valid GIF image', () => {
      const file = createMockFile('anim.gif', 512, 'image/gif')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept a valid WebP image', () => {
      const file = createMockFile('photo.webp', 1024, 'image/webp')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept a valid SVG image', () => {
      const file = createMockFile('icon.svg', 256, 'image/svg+xml')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject a file that exceeds the default 5MB limit', () => {
      const file = createMockFile('big.png', 6 * 1024 * 1024, 'image/png')
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('5MB')
    })

    it('should reject a file that exceeds a custom size limit', () => {
      const file = createMockFile('big.png', 3 * 1024 * 1024, 'image/png')
      const result = validateImageFile(file, { maxSizeMB: 2 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('2MB')
    })

    it('should accept a file within a custom size limit', () => {
      const file = createMockFile('ok.png', 9 * 1024 * 1024, 'image/png')
      const result = validateImageFile(file, { maxSizeMB: 10 })
      expect(result.valid).toBe(true)
    })

    it('should reject a file with invalid MIME type', () => {
      const file = createMockFile('doc.pdf', 1024, 'application/pdf')
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject a file with mismatched extension and MIME type', () => {
      const file = createMockFile('image.jpg', 1024, 'image/png')
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('extension does not match')
    })

    it('should reject a file with no extension', () => {
      const file = createMockFile('noextension', 1024, 'image/png')
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('extension does not match')
    })

    it('should accept .jpeg extension with image/jpeg type', () => {
      const file = createMockFile('photo.jpeg', 1024, 'image/jpeg')
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateDocumentFile', () => {
    it('should accept a valid PDF document', () => {
      const file = createMockFile('receipt.pdf', 2048, 'application/pdf')
      const result = validateDocumentFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept a valid JPEG as document', () => {
      const file = createMockFile('scan.jpg', 1024, 'image/jpeg')
      const result = validateDocumentFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject a file exceeding the default 10MB limit', () => {
      const file = createMockFile('huge.pdf', 11 * 1024 * 1024, 'application/pdf')
      const result = validateDocumentFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('10MB')
    })

    it('should reject SVG files as documents', () => {
      const file = createMockFile('icon.svg', 256, 'image/svg+xml')
      const result = validateDocumentFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should reject a file with mismatched extension and MIME type', () => {
      const file = createMockFile('fake.pdf', 1024, 'image/png')
      const result = validateDocumentFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('extension does not match')
    })
  })
})
