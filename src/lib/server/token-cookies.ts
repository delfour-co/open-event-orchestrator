/**
 * Secure cookie handling for speaker and sponsor tokens.
 * Uses HTTP-only cookies instead of URL parameters to prevent token leakage.
 */

import type { Cookies } from '@sveltejs/kit'

const SPEAKER_TOKEN_COOKIE = 'speaker_token'
const SPONSOR_TOKEN_COOKIE = 'sponsor_token'

const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30 // 30 days
}

/**
 * Sets the speaker token in an HTTP-only cookie.
 */
export function setSpeakerTokenCookie(cookies: Cookies, token: string, editionSlug: string): void {
  // Use edition-specific cookie name to support multiple editions
  const cookieName = `${SPEAKER_TOKEN_COOKIE}_${editionSlug}`
  cookies.set(cookieName, token, COOKIE_OPTIONS)
}

/**
 * Gets the speaker token from cookie or URL (for backwards compatibility).
 * Prioritizes cookie over URL parameter.
 */
export function getSpeakerToken(cookies: Cookies, url: URL, editionSlug: string): string | null {
  const cookieName = `${SPEAKER_TOKEN_COOKIE}_${editionSlug}`

  // Try cookie first
  const cookieToken = cookies.get(cookieName)
  if (cookieToken) {
    return cookieToken
  }

  // Fall back to URL parameter for backwards compatibility
  return url.searchParams.get('token')
}

/**
 * Clears the speaker token cookie.
 */
export function clearSpeakerTokenCookie(cookies: Cookies, editionSlug: string): void {
  const cookieName = `${SPEAKER_TOKEN_COOKIE}_${editionSlug}`
  cookies.delete(cookieName, { path: '/' })
}

/**
 * Sets the sponsor token in an HTTP-only cookie.
 */
export function setSponsorTokenCookie(cookies: Cookies, token: string, editionSlug: string): void {
  const cookieName = `${SPONSOR_TOKEN_COOKIE}_${editionSlug}`
  cookies.set(cookieName, token, COOKIE_OPTIONS)
}

/**
 * Gets the sponsor token from cookie or URL (for backwards compatibility).
 */
export function getSponsorToken(cookies: Cookies, url: URL, editionSlug: string): string | null {
  const cookieName = `${SPONSOR_TOKEN_COOKIE}_${editionSlug}`

  // Try cookie first
  const cookieToken = cookies.get(cookieName)
  if (cookieToken) {
    return cookieToken
  }

  // Fall back to URL parameter for backwards compatibility
  return url.searchParams.get('token')
}

/**
 * Clears the sponsor token cookie.
 */
export function clearSponsorTokenCookie(cookies: Cookies, editionSlug: string): void {
  const cookieName = `${SPONSOR_TOKEN_COOKIE}_${editionSlug}`
  cookies.delete(cookieName, { path: '/' })
}
