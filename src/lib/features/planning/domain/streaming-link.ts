/**
 * Streaming Link Domain
 *
 * Manages streaming configuration for hybrid/online events.
 * Supports multiple platforms, access control, and URL validation.
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

/**
 * Supported streaming platforms
 */
export const STREAMING_PLATFORMS = [
  'youtube',
  'twitch',
  'zoom',
  'teams',
  'meet',
  'webex',
  'vimeo',
  'custom'
] as const

/**
 * Access level for streaming links
 */
export const STREAMING_ACCESS_LEVELS = ['public', 'registered', 'password', 'unique'] as const

/**
 * Session format (in-person, online, hybrid)
 */
export const SESSION_FORMATS = ['in_person', 'online', 'hybrid'] as const

/**
 * Platform display names
 */
export const PLATFORM_LABELS: Record<StreamingPlatform, string> = {
  youtube: 'YouTube',
  twitch: 'Twitch',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  meet: 'Google Meet',
  webex: 'Cisco Webex',
  vimeo: 'Vimeo',
  custom: 'Custom'
}

/**
 * Platform URL patterns for validation and detection
 */
export const PLATFORM_URL_PATTERNS: Record<StreamingPlatform, RegExp> = {
  youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//,
  twitch: /^https?:\/\/(www\.)?twitch\.tv\//,
  zoom: /^https?:\/\/([\w-]+\.)?zoom\.us\//,
  teams: /^https?:\/\/teams\.(microsoft|live)\.com\//,
  meet: /^https?:\/\/meet\.google\.com\//,
  webex: /^https?:\/\/([\w-]+\.)?webex\.com\//,
  vimeo: /^https?:\/\/(www\.)?(vimeo\.com|player\.vimeo\.com)\//,
  custom: /^https?:\/\/.+/
}

/**
 * Platform embed URL patterns
 */
export const PLATFORM_EMBED_PATTERNS: Record<
  Exclude<StreamingPlatform, 'custom' | 'zoom' | 'teams' | 'meet' | 'webex'>,
  (url: string) => string | null
> = {
  youtube: (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  },
  twitch: (url: string) => {
    const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
    return match ? `https://player.twitch.tv/?channel=${match[1]}&parent=localhost` : null
  },
  vimeo: (url: string) => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    return match ? `https://player.vimeo.com/video/${match[1]}` : null
  }
}

// ============================================================================
// Schemas
// ============================================================================

export const streamingPlatformSchema = z.enum(STREAMING_PLATFORMS)
export type StreamingPlatform = z.infer<typeof streamingPlatformSchema>

export const streamingAccessLevelSchema = z.enum(STREAMING_ACCESS_LEVELS)
export type StreamingAccessLevel = z.infer<typeof streamingAccessLevelSchema>

export const sessionFormatSchema = z.enum(SESSION_FORMATS)
export type SessionFormat = z.infer<typeof sessionFormatSchema>

/**
 * Streaming configuration for a session
 */
export const streamingConfigSchema = z.object({
  platform: streamingPlatformSchema.default('custom'),
  streamUrl: z.string().url().max(500),
  accessLevel: streamingAccessLevelSchema.default('public'),
  password: z.string().max(100).optional(),
  allowEmbed: z.boolean().default(false),
  scheduledStartTime: z.date().optional(),
  meetingId: z.string().max(100).optional(),
  passcode: z.string().max(50).optional()
})

export type StreamingConfig = z.infer<typeof streamingConfigSchema>

/**
 * Create streaming config schema (for new configs)
 */
export const createStreamingConfigSchema = streamingConfigSchema

export type CreateStreamingConfig = z.infer<typeof createStreamingConfigSchema>

/**
 * Session streaming information (extends session with streaming data)
 */
export const sessionStreamingSchema = z.object({
  sessionId: z.string(),
  format: sessionFormatSchema.default('in_person'),
  streaming: streamingConfigSchema.optional()
})

export type SessionStreaming = z.infer<typeof sessionStreamingSchema>

/**
 * Unique participant streaming link
 */
export const participantStreamingLinkSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  participantId: z.string(), // Ticket holder or registered user
  uniqueToken: z.string().length(32),
  streamUrl: z.string().url(),
  accessedAt: z.date().optional(),
  accessCount: z.number().int().min(0).default(0),
  maxAccess: z.number().int().min(1).default(1),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ParticipantStreamingLink = z.infer<typeof participantStreamingLinkSchema>

export const createParticipantStreamingLinkSchema = participantStreamingLinkSchema.omit({
  id: true,
  accessedAt: true,
  accessCount: true,
  createdAt: true,
  updatedAt: true
})

export type CreateParticipantStreamingLink = z.infer<typeof createParticipantStreamingLinkSchema>

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate streaming configuration
 */
export function validateStreamingConfig(data: unknown): StreamingConfig {
  return streamingConfigSchema.parse(data)
}

/**
 * Validate participant streaming link
 */
export function validateParticipantStreamingLink(data: unknown): ParticipantStreamingLink {
  return participantStreamingLinkSchema.parse(data)
}

/**
 * Validate URL matches expected platform
 */
export function validatePlatformUrl(url: string, platform: StreamingPlatform): boolean {
  const pattern = PLATFORM_URL_PATTERNS[platform]
  return pattern.test(url)
}

/**
 * Validate streaming config has required fields based on access level
 */
export function validateAccessConfig(config: StreamingConfig): string[] {
  const errors: string[] = []

  if (config.accessLevel === 'password' && !config.password) {
    errors.push('Password is required for password-protected streams')
  }

  return errors
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect streaming platform from URL
 */
export function detectPlatformFromUrl(url: string): StreamingPlatform {
  for (const [platform, pattern] of Object.entries(PLATFORM_URL_PATTERNS)) {
    if (platform !== 'custom' && pattern.test(url)) {
      return platform as StreamingPlatform
    }
  }
  return 'custom'
}

/**
 * Check if URL is a valid streaming URL
 */
export function isValidStreamingUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Check if platform supports embedding
 */
export function platformSupportsEmbed(platform: StreamingPlatform): boolean {
  return ['youtube', 'twitch', 'vimeo'].includes(platform)
}

// ============================================================================
// URL Transformation Functions
// ============================================================================

/**
 * Get embed URL for a streaming URL
 */
export function getEmbedUrl(url: string, platform?: StreamingPlatform): string | null {
  const detectedPlatform = platform ?? detectPlatformFromUrl(url)

  if (detectedPlatform === 'custom' || !platformSupportsEmbed(detectedPlatform)) {
    return null
  }

  const embedFn = PLATFORM_EMBED_PATTERNS[detectedPlatform as keyof typeof PLATFORM_EMBED_PATTERNS]
  return embedFn ? embedFn(url) : null
}

/**
 * Extract video/stream ID from URL
 */
export function extractStreamId(url: string, platform?: StreamingPlatform): string | null {
  const detectedPlatform = platform ?? detectPlatformFromUrl(url)

  switch (detectedPlatform) {
    case 'youtube': {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/)
      return match ? match[1] : null
    }
    case 'twitch': {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
      return match ? match[1] : null
    }
    case 'vimeo': {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      return match ? match[1] : null
    }
    case 'zoom': {
      const match = url.match(/zoom\.us\/j\/(\d+)/)
      return match ? match[1] : null
    }
    case 'meet': {
      const match = url.match(/meet\.google\.com\/([a-z-]+)/)
      return match ? match[1] : null
    }
    default:
      return null
  }
}

// ============================================================================
// Access Control Functions
// ============================================================================

/**
 * Check if user can access streaming link
 */
export function canAccessStream(
  config: StreamingConfig,
  options: {
    isRegistered?: boolean
    providedPassword?: string
    hasUniqueLink?: boolean
  }
): { allowed: boolean; reason?: string } {
  switch (config.accessLevel) {
    case 'public':
      return { allowed: true }

    case 'registered':
      if (options.isRegistered) {
        return { allowed: true }
      }
      return { allowed: false, reason: 'Registration required to access this stream' }

    case 'password':
      if (!options.providedPassword) {
        return { allowed: false, reason: 'Password required to access this stream' }
      }
      if (options.providedPassword !== config.password) {
        return { allowed: false, reason: 'Invalid password' }
      }
      return { allowed: true }

    case 'unique':
      if (options.hasUniqueLink) {
        return { allowed: true }
      }
      return { allowed: false, reason: 'Unique link required to access this stream' }

    default:
      return { allowed: false, reason: 'Unknown access level' }
  }
}

/**
 * Check if participant streaming link is valid
 */
export function isParticipantLinkValid(link: ParticipantStreamingLink): {
  valid: boolean
  reason?: string
} {
  // Check expiration
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { valid: false, reason: 'Link has expired' }
  }

  // Check access count
  if (link.accessCount >= link.maxAccess) {
    return { valid: false, reason: 'Maximum access count reached' }
  }

  return { valid: true }
}

/**
 * Generate unique token for participant link
 */
export function generateStreamingToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get platform display label
 */
export function getPlatformLabel(platform: StreamingPlatform): string {
  return PLATFORM_LABELS[platform]
}

/**
 * Get access level display label
 */
export function getAccessLevelLabel(level: StreamingAccessLevel): string {
  const labels: Record<StreamingAccessLevel, string> = {
    public: 'Public',
    registered: 'Registered Users Only',
    password: 'Password Protected',
    unique: 'Unique Link per Participant'
  }
  return labels[level]
}

/**
 * Get session format display label
 */
export function getSessionFormatLabel(format: SessionFormat): string {
  const labels: Record<SessionFormat, string> = {
    in_person: 'In-Person',
    online: 'Online',
    hybrid: 'Hybrid'
  }
  return labels[format]
}

/**
 * Get session format icon name
 */
export function getSessionFormatIcon(format: SessionFormat): string {
  const icons: Record<SessionFormat, string> = {
    in_person: 'users',
    online: 'video',
    hybrid: 'monitor-smartphone'
  }
  return icons[format]
}

// ============================================================================
// Countdown Functions
// ============================================================================

/**
 * Calculate time until stream starts
 */
export function getTimeUntilStream(scheduledStartTime: Date): {
  isLive: boolean
  isPast: boolean
  timeRemaining: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  formatted: string
} {
  const now = new Date()
  const diff = scheduledStartTime.getTime() - now.getTime()

  if (diff <= 0) {
    return {
      isLive: true,
      isPast: diff < -3600000, // More than 1 hour ago
      timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0 },
      formatted: 'Live now'
    }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  let formatted: string
  if (days > 0) {
    formatted = `${days}d ${hours}h`
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`
  } else {
    formatted = `${seconds}s`
  }

  return {
    isLive: false,
    isPast: false,
    timeRemaining: { days, hours, minutes, seconds },
    formatted
  }
}

/**
 * Format scheduled start time for display
 */
export function formatStreamingTime(date: Date, timezone?: string): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}

// ============================================================================
// Session Streaming Helpers
// ============================================================================

/**
 * Check if session has streaming configured
 */
export function hasStreamingConfig(session: {
  format?: SessionFormat
  streaming?: StreamingConfig
}): boolean {
  return (
    (session.format === 'online' || session.format === 'hybrid') &&
    session.streaming !== undefined &&
    !!session.streaming.streamUrl
  )
}

/**
 * Check if session is online-only
 */
export function isOnlineOnly(session: { format?: SessionFormat }): boolean {
  return session.format === 'online'
}

/**
 * Check if session is hybrid
 */
export function isHybridSession(session: { format?: SessionFormat }): boolean {
  return session.format === 'hybrid'
}

/**
 * Get streaming URL for display (may be masked for security)
 */
export function getDisplayStreamUrl(
  config: StreamingConfig,
  options: { showFull?: boolean } = {}
): string {
  if (options.showFull) {
    return config.streamUrl
  }

  // Mask URL for non-public streams
  if (config.accessLevel !== 'public') {
    const platform = getPlatformLabel(config.platform)
    return `${platform} stream (access restricted)`
  }

  return config.streamUrl
}

/**
 * Create streaming config from URL with auto-detection
 */
export function createStreamingConfigFromUrl(
  url: string,
  options: Partial<Omit<StreamingConfig, 'streamUrl'>> = {}
): StreamingConfig {
  const platform = detectPlatformFromUrl(url)
  const allowEmbed = platformSupportsEmbed(platform)

  return {
    platform,
    streamUrl: url,
    accessLevel: options.accessLevel ?? 'public',
    password: options.password,
    allowEmbed: options.allowEmbed ?? allowEmbed,
    scheduledStartTime: options.scheduledStartTime,
    meetingId: options.meetingId ?? extractStreamId(url, platform) ?? undefined,
    passcode: options.passcode
  }
}
