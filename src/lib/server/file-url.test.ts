import { describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_POCKETBASE_URL: 'http://test:8090' }
}))

import { buildFileUrl } from './file-url'

describe('file-url', () => {
  describe('buildFileUrl', () => {
    it('should return correct URL for given collection, recordId, and filename', () => {
      const result = buildFileUrl('organizations', 'id123', 'logo.png')
      expect(result).toBe('http://test:8090/api/files/organizations/id123/logo.png')
    })

    it('should handle different collection names', () => {
      const result = buildFileUrl('events', 'evt456', 'banner.jpg')
      expect(result).toBe('http://test:8090/api/files/events/evt456/banner.jpg')
    })

    it('should handle filenames with special characters', () => {
      const result = buildFileUrl('uploads', 'rec1', 'my file (1).pdf')
      expect(result).toBe('http://test:8090/api/files/uploads/rec1/my file (1).pdf')
    })
  })
})
