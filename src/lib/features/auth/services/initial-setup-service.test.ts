import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkIsFirstRun, displaySetupLink } from './initial-setup-service'

describe('Initial Setup Service', () => {
  describe('checkIsFirstRun', () => {
    it('should return true when no users exist', async () => {
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ totalItems: 0 })
        })
      }

      const result = await checkIsFirstRun(
        mockPb as unknown as Parameters<typeof checkIsFirstRun>[0]
      )
      expect(result).toBe(true)
      expect(mockPb.collection).toHaveBeenCalledWith('users')
    })

    it('should return false when users exist', async () => {
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ totalItems: 5 })
        })
      }

      const result = await checkIsFirstRun(
        mockPb as unknown as Parameters<typeof checkIsFirstRun>[0]
      )
      expect(result).toBe(false)
    })

    it('should return true when collection access fails', async () => {
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockRejectedValue(new Error('Collection not found'))
        })
      }

      const result = await checkIsFirstRun(
        mockPb as unknown as Parameters<typeof checkIsFirstRun>[0]
      )
      expect(result).toBe(true)
    })
  })

  describe('displaySetupLink', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    it('should display the setup link with formatting', () => {
      displaySetupLink('http://localhost:5173/setup/abc123')

      expect(console.log).toHaveBeenCalled()

      const calls = vi.mocked(console.log).mock.calls.flat()
      const output = calls.join('\n')

      expect(output).toContain('INITIAL SETUP REQUIRED')
      expect(output).toContain('http://localhost:5173/setup/abc123')
      expect(output).toContain('24 hours')
    })

    it('should include separator lines', () => {
      displaySetupLink('http://localhost:5173/setup/test')

      const calls = vi.mocked(console.log).mock.calls.flat()
      const separatorLine = '='.repeat(70)
      expect(calls).toContain(separatorLine)
    })
  })
})
