import { beforeEach, describe, expect, it, vi } from 'vitest'

// Use vi.hoisted to ensure mocks are defined before they're used
const { mockSet, mockUpdate, mockSubscribe, mockStoreState, mockClassList, mockMatchMedia } =
  vi.hoisted(() => {
    const state = { value: 'system' as 'light' | 'dark' | 'system' }
    return {
      mockStoreState: state,
      mockSet: vi.fn((value: 'light' | 'dark' | 'system') => {
        state.value = value
      }),
      mockUpdate: vi.fn(
        (fn: (current: 'light' | 'dark' | 'system') => 'light' | 'dark' | 'system') => {
          state.value = fn(state.value)
        }
      ),
      mockSubscribe: vi.fn(),
      mockClassList: { toggle: vi.fn() },
      mockMatchMedia: vi.fn(() => ({ matches: false }))
    }
  })

// Mock $app/environment
vi.mock('$app/environment', () => ({
  browser: true
}))

// Mock svelte-persisted-store
vi.mock('svelte-persisted-store', () => ({
  persisted: () => ({
    set: mockSet,
    update: mockUpdate,
    subscribe: mockSubscribe
  })
}))

// Mock fetch for server sync tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock document
vi.stubGlobal('document', {
  documentElement: {
    classList: mockClassList
  }
})

// Mock window
vi.stubGlobal('window', {
  matchMedia: mockMatchMedia
})

import { applyTheme, loadThemeFromServer, setTheme, syncThemeToServer, toggleTheme } from './theme'

describe('Theme Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.value = 'system'
    mockMatchMedia.mockReturnValue({ matches: false })
  })

  describe('applyTheme', () => {
    it('should apply dark class when theme is dark', () => {
      applyTheme('dark')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should remove dark class when theme is light', () => {
      applyTheme('light')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', false)
    })

    it('should apply dark class when system prefers dark', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      applyTheme('system')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should remove dark class when system prefers light', () => {
      mockMatchMedia.mockReturnValue({ matches: false })
      applyTheme('system')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', false)
    })
  })

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      mockStoreState.value = 'dark'
      toggleTheme()
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockStoreState.value).toBe('light')
    })

    it('should toggle from light to dark', () => {
      mockStoreState.value = 'light'
      toggleTheme()
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockStoreState.value).toBe('dark')
    })

    it('should toggle from system to dark', () => {
      mockStoreState.value = 'system'
      toggleTheme()
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockStoreState.value).toBe('dark')
    })
  })

  describe('syncThemeToServer', () => {
    it('should POST theme to server', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const result = await syncThemeToServer('dark')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme: 'dark' })
      })
    })

    it('should return false when server request fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await syncThemeToServer('light')

      expect(result).toBe(false)
    })

    it('should return false when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await syncThemeToServer('dark')

      expect(result).toBe(false)
    })
  })

  describe('loadThemeFromServer', () => {
    it('should load theme from server and apply it', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: { theme: 'dark' } })
      })

      const result = await loadThemeFromServer()

      expect(result).toBe('dark')
      expect(mockSet).toHaveBeenCalledWith('dark')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should return null when server returns no theme', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ preferences: {} })
      })

      const result = await loadThemeFromServer()

      expect(result).toBeNull()
    })

    it('should return null when server request fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const result = await loadThemeFromServer()

      expect(result).toBeNull()
    })

    it('should return null when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await loadThemeFromServer()

      expect(result).toBeNull()
    })
  })

  describe('setTheme', () => {
    it('should set theme and apply it without syncing', () => {
      setTheme('dark', false)

      expect(mockSet).toHaveBeenCalledWith('dark')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should set theme and sync to server when requested', () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      setTheme('light', true)

      expect(mockSet).toHaveBeenCalledWith('light')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', false)
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should set theme to system and check media query', () => {
      mockMatchMedia.mockReturnValue({ matches: true })
      setTheme('system', false)

      expect(mockSet).toHaveBeenCalledWith('system')
      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
    })
  })
})
