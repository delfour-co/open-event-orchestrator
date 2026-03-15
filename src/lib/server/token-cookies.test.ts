import type { Cookies } from '@sveltejs/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSpeakerTokenCookie,
  clearSponsorTokenCookie,
  getSpeakerToken,
  getSponsorToken,
  setSpeakerTokenCookie,
  setSponsorTokenCookie
} from './token-cookies'

function createMockCookies(): Cookies {
  const store = new Map<string, string>()
  return {
    get: vi.fn((name: string) => store.get(name)),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value)
    }),
    delete: vi.fn((name: string) => {
      store.delete(name)
    }),
    getAll: vi.fn(() => []),
    serialize: vi.fn(() => '')
  } as unknown as Cookies
}

function createMockUrl(params: Record<string, string> = {}): URL {
  const url = new URL('http://localhost:3000/test')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url
}

describe('token-cookies', () => {
  let cookies: Cookies

  beforeEach(() => {
    cookies = createMockCookies()
  })

  describe('setSpeakerTokenCookie', () => {
    it('should set a cookie with edition-specific name', () => {
      setSpeakerTokenCookie(cookies, 'my-token', 'edition-2024')

      expect(cookies.set).toHaveBeenCalledWith(
        'speaker_token_edition-2024',
        'my-token',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30
        })
      )
    })

    it('should use different cookie names for different editions', () => {
      setSpeakerTokenCookie(cookies, 'token-a', 'edition-a')
      setSpeakerTokenCookie(cookies, 'token-b', 'edition-b')

      expect(cookies.set).toHaveBeenCalledTimes(2)
      expect(cookies.set).toHaveBeenCalledWith(
        'speaker_token_edition-a',
        'token-a',
        expect.any(Object)
      )
      expect(cookies.set).toHaveBeenCalledWith(
        'speaker_token_edition-b',
        'token-b',
        expect.any(Object)
      )
    })
  })

  describe('getSpeakerToken', () => {
    it('should return token from cookie if present', () => {
      setSpeakerTokenCookie(cookies, 'cookie-token', 'edition-2024')
      const url = createMockUrl({ token: 'url-token' })

      const result = getSpeakerToken(cookies, url, 'edition-2024')

      expect(result).toBe('cookie-token')
    })

    it('should fall back to URL parameter if cookie is not set', () => {
      const url = createMockUrl({ token: 'url-token' })

      const result = getSpeakerToken(cookies, url, 'edition-2024')

      expect(result).toBe('url-token')
    })

    it('should return null if neither cookie nor URL parameter exists', () => {
      const url = createMockUrl()

      const result = getSpeakerToken(cookies, url, 'edition-2024')

      expect(result).toBeNull()
    })

    it('should prioritize cookie over URL parameter', () => {
      setSpeakerTokenCookie(cookies, 'from-cookie', 'ed1')
      const url = createMockUrl({ token: 'from-url' })

      const result = getSpeakerToken(cookies, url, 'ed1')

      expect(result).toBe('from-cookie')
    })
  })

  describe('clearSpeakerTokenCookie', () => {
    it('should delete the cookie with the correct name and path', () => {
      clearSpeakerTokenCookie(cookies, 'edition-2024')

      expect(cookies.delete).toHaveBeenCalledWith('speaker_token_edition-2024', { path: '/' })
    })
  })

  describe('setSponsorTokenCookie', () => {
    it('should set a cookie with edition-specific name', () => {
      setSponsorTokenCookie(cookies, 'sponsor-tok', 'edition-2024')

      expect(cookies.set).toHaveBeenCalledWith(
        'sponsor_token_edition-2024',
        'sponsor-tok',
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        })
      )
    })
  })

  describe('getSponsorToken', () => {
    it('should return token from cookie if present', () => {
      setSponsorTokenCookie(cookies, 'sponsor-cookie', 'edition-2024')
      const url = createMockUrl({ token: 'sponsor-url' })

      const result = getSponsorToken(cookies, url, 'edition-2024')

      expect(result).toBe('sponsor-cookie')
    })

    it('should fall back to URL parameter if cookie is not set', () => {
      const url = createMockUrl({ token: 'sponsor-url' })

      const result = getSponsorToken(cookies, url, 'edition-2024')

      expect(result).toBe('sponsor-url')
    })

    it('should return null if neither cookie nor URL parameter exists', () => {
      const url = createMockUrl()

      const result = getSponsorToken(cookies, url, 'edition-2024')

      expect(result).toBeNull()
    })
  })

  describe('clearSponsorTokenCookie', () => {
    it('should delete the cookie with the correct name and path', () => {
      clearSponsorTokenCookie(cookies, 'edition-2024')

      expect(cookies.delete).toHaveBeenCalledWith('sponsor_token_edition-2024', { path: '/' })
    })
  })
})
