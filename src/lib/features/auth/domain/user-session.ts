import { z } from 'zod'

export const userSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tokenHash: z.string(),
  userAgent: z.string(),
  ipAddress: z.string(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  device: z.string().optional(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lastActive: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserSession = z.infer<typeof userSessionSchema>

export const createUserSessionSchema = userSessionSchema.omit({
  id: true,
  browser: true,
  browserVersion: true,
  os: true,
  osVersion: true,
  device: true,
  createdAt: true,
  updatedAt: true
})

export type CreateUserSession = z.infer<typeof createUserSessionSchema>

/**
 * Parses user agent string to extract browser, OS, and device information.
 */
export function parseUserAgent(userAgent: string): {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  device: string
} {
  const result = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    device: 'Desktop'
  }

  if (!userAgent) {
    return result
  }

  // Detect browser
  if (userAgent.includes('Firefox/')) {
    result.browser = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+(?:\.\d+)*)/)
    if (match) result.browserVersion = match[1]
  } else if (userAgent.includes('Edg/')) {
    result.browser = 'Edge'
    const match = userAgent.match(/Edg\/(\d+(?:\.\d+)*)/)
    if (match) result.browserVersion = match[1]
  } else if (userAgent.includes('Chrome/')) {
    result.browser = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+(?:\.\d+)*)/)
    if (match) result.browserVersion = match[1]
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    result.browser = 'Safari'
    const match = userAgent.match(/Version\/(\d+(?:\.\d+)*)/)
    if (match) result.browserVersion = match[1]
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) {
    result.browser = 'Opera'
    const match = userAgent.match(/(?:Opera|OPR)\/(\d+(?:\.\d+)*)/)
    if (match) result.browserVersion = match[1]
  }

  // Detect OS - order matters! Check mobile OS before desktop equivalents
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    // iOS detection must come before macOS because iOS user agents contain "Mac OS X"
    result.os = 'iOS'
    const match = userAgent.match(/OS (\d+(?:_\d+)*)/)
    if (match) result.osVersion = match[1].replace(/_/g, '.')
  } else if (userAgent.includes('Android')) {
    // Android detection must come before Linux because Android user agents contain "Linux"
    result.os = 'Android'
    const match = userAgent.match(/Android (\d+(?:\.\d+)*)/)
    if (match) result.osVersion = match[1]
  } else if (userAgent.includes('Windows NT')) {
    result.os = 'Windows'
    const match = userAgent.match(/Windows NT (\d+(?:\.\d+)*)/)
    if (match) {
      const version = match[1]
      // Map Windows NT version to friendly name
      const versionMap: Record<string, string> = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
        '6.0': 'Vista',
        '5.1': 'XP'
      }
      result.osVersion = versionMap[version] || version
    }
  } else if (userAgent.includes('Mac OS X')) {
    result.os = 'macOS'
    const match = userAgent.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)*)/)
    if (match) result.osVersion = match[1].replace(/_/g, '.')
  } else if (userAgent.includes('Linux')) {
    result.os = 'Linux'
    if (userAgent.includes('Ubuntu')) result.osVersion = 'Ubuntu'
    else if (userAgent.includes('Fedora')) result.osVersion = 'Fedora'
    else if (userAgent.includes('Debian')) result.osVersion = 'Debian'
  }

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      result.device = 'Tablet'
    } else {
      result.device = 'Mobile'
    }
  } else if (userAgent.includes('iPad')) {
    result.device = 'Tablet'
  }

  return result
}

/**
 * Formats session date for display.
 */
export function formatSessionDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined
  })
}

/**
 * Generates a hash of the auth token for session tracking.
 * Uses a simple hash to avoid storing the full token.
 */
export function hashToken(token: string): string {
  // Simple hash function - in production, use a proper crypto hash
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Gets display name for a session (browser + device).
 */
export function getSessionDisplayName(session: UserSession): string {
  const parts: string[] = []

  if (session.browser && session.browser !== 'Unknown') {
    parts.push(session.browser)
  }

  if (session.os && session.os !== 'Unknown') {
    parts.push(`on ${session.os}`)
  }

  if (parts.length === 0) {
    return 'Unknown browser'
  }

  return parts.join(' ')
}

/**
 * Gets location display string for a session.
 */
export function getSessionLocation(session: UserSession): string | null {
  if (session.city && session.country) {
    return `${session.city}, ${session.country}`
  }
  if (session.country) {
    return session.country
  }
  if (session.city) {
    return session.city
  }
  return null
}
