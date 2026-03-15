import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) => {
    let result = ''
    for (let i = 0; i < strings.length; i++) {
      result += strings[i]
      if (i < values.length) {
        result += `"${values[i]}"`
      }
    }
    return result
  },
  filterAnd: (...conditions: string[]) => conditions.filter(Boolean).join(' && ')
}))

import {
  buildReimbursementsUrl,
  buildSubmissionsUrl,
  generateSpeakerToken,
  refreshSpeakerToken,
  validateSpeakerToken
} from './speaker-tokens'

function createMockPb(): PocketBase {
  return {
    collection: vi.fn()
  } as unknown as PocketBase
}

describe('speaker-tokens', () => {
  let pb: PocketBase

  beforeEach(() => {
    pb = createMockPb()
    vi.clearAllMocks()
  })

  describe('generateSpeakerToken', () => {
    it('should return existing valid token if one exists', async () => {
      const mockCollection = {
        getFirstListItem: vi.fn().mockResolvedValue({ token: 'existing-token-abc' }),
        create: vi.fn()
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const token = await generateSpeakerToken(pb, 'speaker-1', 'edition-1')

      expect(token).toBe('existing-token-abc')
      expect(mockCollection.create).not.toHaveBeenCalled()
    })

    it('should create a new token if no existing valid token found', async () => {
      const mockCollection = {
        getFirstListItem: vi.fn().mockRejectedValue(new Error('not found')),
        create: vi.fn().mockResolvedValue({})
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const token = await generateSpeakerToken(pb, 'speaker-1', 'edition-1')

      expect(token).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          speakerId: 'speaker-1',
          editionId: 'edition-1',
          token: expect.any(String),
          expiresAt: expect.any(String)
        })
      )
    })

    it('should create token with 30-day expiry', async () => {
      const mockCollection = {
        getFirstListItem: vi.fn().mockRejectedValue(new Error('not found')),
        create: vi.fn().mockResolvedValue({})
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const before = new Date()
      before.setDate(before.getDate() + 29)

      await generateSpeakerToken(pb, 'speaker-1', 'edition-1')

      const createCall = mockCollection.create.mock.calls[0][0] as {
        expiresAt: string
      }
      const expiresAt = new Date(createCall.expiresAt)
      const after = new Date()
      after.setDate(after.getDate() + 31)

      expect(expiresAt.getTime()).toBeGreaterThan(before.getTime())
      expect(expiresAt.getTime()).toBeLessThan(after.getTime())
    })
  })

  describe('validateSpeakerToken', () => {
    it('should return valid with speakerId for a valid token', async () => {
      const mockCollection = {
        getFirstListItem: vi.fn().mockResolvedValue({ speakerId: 'speaker-42' })
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const result = await validateSpeakerToken(pb, 'valid-token', 'edition-1')

      expect(result.valid).toBe(true)
      expect(result.speakerId).toBe('speaker-42')
    })

    it('should return invalid for an expired or non-existent token', async () => {
      const mockCollection = {
        getFirstListItem: vi.fn().mockRejectedValue(new Error('not found'))
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const result = await validateSpeakerToken(pb, 'invalid-token', 'edition-1')

      expect(result.valid).toBe(false)
      expect(result.speakerId).toBeUndefined()
    })
  })

  describe('refreshSpeakerToken', () => {
    it('should delete existing tokens and create a new one', async () => {
      const mockDeleteCollection = {
        getFullList: vi.fn().mockResolvedValue([{ id: 'old-1' }, { id: 'old-2' }]),
        delete: vi.fn().mockResolvedValue({})
      }
      const mockCreateCollection = {
        getFirstListItem: vi.fn().mockRejectedValue(new Error('not found')),
        create: vi.fn().mockResolvedValue({})
      }

      let callCount = 0
      vi.mocked(pb.collection).mockImplementation(() => {
        callCount++
        // First call is for getFullList (delete phase), second for delete calls,
        // third+ for generateSpeakerToken
        if (callCount <= 3) {
          return mockDeleteCollection as never
        }
        return mockCreateCollection as never
      })

      const token = await refreshSpeakerToken(pb, 'speaker-1', 'edition-1')

      expect(token).toHaveLength(64)
      expect(mockDeleteCollection.delete).toHaveBeenCalledTimes(2)
      expect(mockDeleteCollection.delete).toHaveBeenCalledWith('old-1')
      expect(mockDeleteCollection.delete).toHaveBeenCalledWith('old-2')
    })

    it('should create a new token even if no existing tokens to delete', async () => {
      const mockCollection = {
        getFullList: vi.fn().mockRejectedValue(new Error('none')),
        getFirstListItem: vi.fn().mockRejectedValue(new Error('not found')),
        create: vi.fn().mockResolvedValue({})
      }
      vi.mocked(pb.collection).mockReturnValue(mockCollection as never)

      const token = await refreshSpeakerToken(pb, 'speaker-1', 'edition-1')

      expect(token).toHaveLength(64)
    })
  })

  describe('buildSubmissionsUrl', () => {
    it('should build a correct submissions URL with token', () => {
      const url = buildSubmissionsUrl('https://example.com', 'conf-2024', 'abc123')

      expect(url).toBe('https://example.com/cfp/conf-2024/submissions?token=abc123')
    })

    it('should handle trailing slash in base URL', () => {
      const url = buildSubmissionsUrl('https://example.com/', 'conf-2024', 'abc123')

      // Note: the function does not strip trailing slashes
      expect(url).toBe('https://example.com//cfp/conf-2024/submissions?token=abc123')
    })
  })

  describe('buildReimbursementsUrl', () => {
    it('should build a correct reimbursements URL with token', () => {
      const url = buildReimbursementsUrl('https://example.com', 'conf-2024', 'abc123')

      expect(url).toBe('https://example.com/speaker/conf-2024/reimbursements?token=abc123')
    })
  })
})
