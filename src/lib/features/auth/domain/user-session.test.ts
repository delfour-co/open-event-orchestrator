import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type UserSession,
  formatSessionDate,
  getSessionDisplayName,
  getSessionLocation,
  hashToken,
  parseUserAgent
} from './user-session'

describe('parseUserAgent', () => {
  it('should parse Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Chrome')
    expect(result.browserVersion).toBe('120.0.0.0')
    expect(result.os).toBe('Windows')
    expect(result.osVersion).toBe('10/11')
    expect(result.device).toBe('Desktop')
  })

  it('should parse Firefox on macOS', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Firefox')
    expect(result.browserVersion).toBe('121.0')
    expect(result.os).toBe('macOS')
    expect(result.device).toBe('Desktop')
  })

  it('should parse Safari on iOS', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Safari')
    expect(result.browserVersion).toBe('17.2')
    expect(result.os).toBe('iOS')
    expect(result.osVersion).toBe('17.2')
    expect(result.device).toBe('Mobile')
  })

  it('should parse Edge on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Edge')
    expect(result.browserVersion).toBe('120.0.2210.91')
    expect(result.os).toBe('Windows')
    expect(result.device).toBe('Desktop')
  })

  it('should parse Chrome on Android', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Chrome')
    expect(result.os).toBe('Android')
    expect(result.osVersion).toBe('14')
    expect(result.device).toBe('Mobile')
  })

  it('should parse Safari on iPad', () => {
    const ua =
      'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Safari')
    expect(result.os).toBe('iOS')
    expect(result.device).toBe('Tablet')
  })

  it('should handle empty user agent', () => {
    const result = parseUserAgent('')

    expect(result.browser).toBe('Unknown')
    expect(result.os).toBe('Unknown')
    expect(result.device).toBe('Desktop')
  })

  it('should parse Linux user agent', () => {
    const ua =
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)

    expect(result.browser).toBe('Chrome')
    expect(result.os).toBe('Linux')
    expect(result.device).toBe('Desktop')
  })

  it('should detect Ubuntu on Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
    const result = parseUserAgent(ua)

    expect(result.os).toBe('Linux')
    expect(result.osVersion).toBe('Ubuntu')
  })
})

describe('formatSessionDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for very recent dates', () => {
    const date = new Date('2024-01-15T11:59:30Z')
    expect(formatSessionDate(date)).toBe('Just now')
  })

  it('should return minutes ago for recent dates', () => {
    const date = new Date('2024-01-15T11:45:00Z')
    expect(formatSessionDate(date)).toBe('15 minutes ago')
  })

  it('should return singular minute', () => {
    const date = new Date('2024-01-15T11:59:00Z')
    expect(formatSessionDate(date)).toBe('1 minute ago')
  })

  it('should return hours ago for dates within a day', () => {
    const date = new Date('2024-01-15T08:00:00Z')
    expect(formatSessionDate(date)).toBe('4 hours ago')
  })

  it('should return singular hour', () => {
    const date = new Date('2024-01-15T11:00:00Z')
    expect(formatSessionDate(date)).toBe('1 hour ago')
  })

  it('should return days ago for dates within a week', () => {
    const date = new Date('2024-01-12T12:00:00Z')
    expect(formatSessionDate(date)).toBe('3 days ago')
  })

  it('should return formatted date for older dates', () => {
    const date = new Date('2024-01-01T12:00:00Z')
    expect(formatSessionDate(date)).toBe('Jan 1')
  })

  it('should include year for dates more than a year old', () => {
    const date = new Date('2022-06-15T12:00:00Z')
    expect(formatSessionDate(date)).toBe('Jun 15, 2022')
  })
})

describe('hashToken', () => {
  it('should generate consistent hash for same input', () => {
    const token = 'test-token-123'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)

    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different inputs', () => {
    const hash1 = hashToken('token-1')
    const hash2 = hashToken('token-2')

    expect(hash1).not.toBe(hash2)
  })

  it('should return a string', () => {
    const hash = hashToken('any-token')
    expect(typeof hash).toBe('string')
  })
})

describe('getSessionDisplayName', () => {
  const baseSession: UserSession = {
    id: 'session-1',
    userId: 'user-1',
    tokenHash: 'hash-1',
    userAgent: 'test',
    ipAddress: '127.0.0.1',
    browser: 'Chrome',
    browserVersion: '120',
    os: 'Windows',
    osVersion: '10',
    device: 'Desktop',
    city: null,
    country: null,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('should return browser and OS', () => {
    const result = getSessionDisplayName(baseSession)
    expect(result).toBe('Chrome on Windows')
  })

  it('should return only browser if OS is unknown', () => {
    const session = { ...baseSession, os: 'Unknown' }
    const result = getSessionDisplayName(session)
    expect(result).toBe('Chrome')
  })

  it('should return "Unknown browser" if both are unknown', () => {
    const session = { ...baseSession, browser: 'Unknown', os: 'Unknown' }
    const result = getSessionDisplayName(session)
    expect(result).toBe('Unknown browser')
  })

  it('should handle undefined browser', () => {
    const session = { ...baseSession, browser: undefined, os: 'Windows' }
    const result = getSessionDisplayName(session)
    expect(result).toBe('on Windows')
  })
})

describe('getSessionLocation', () => {
  const baseSession: UserSession = {
    id: 'session-1',
    userId: 'user-1',
    tokenHash: 'hash-1',
    userAgent: 'test',
    ipAddress: '127.0.0.1',
    browser: 'Chrome',
    os: 'Windows',
    device: 'Desktop',
    city: 'Paris',
    country: 'France',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('should return city and country', () => {
    const result = getSessionLocation(baseSession)
    expect(result).toBe('Paris, France')
  })

  it('should return only country if city is null', () => {
    const session = { ...baseSession, city: null }
    const result = getSessionLocation(session)
    expect(result).toBe('France')
  })

  it('should return only city if country is null', () => {
    const session = { ...baseSession, country: null }
    const result = getSessionLocation(session)
    expect(result).toBe('Paris')
  })

  it('should return null if both are null', () => {
    const session = { ...baseSession, city: null, country: null }
    const result = getSessionLocation(session)
    expect(result).toBeNull()
  })
})
