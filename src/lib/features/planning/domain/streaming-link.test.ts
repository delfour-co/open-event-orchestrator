/**
 * Streaming Link Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type ParticipantStreamingLink,
  type SessionFormat,
  type StreamingConfig,
  canAccessStream,
  createStreamingConfigFromUrl,
  detectPlatformFromUrl,
  extractStreamId,
  formatStreamingTime,
  generateStreamingToken,
  getAccessLevelLabel,
  getDisplayStreamUrl,
  getEmbedUrl,
  getPlatformLabel,
  getSessionFormatIcon,
  getSessionFormatLabel,
  getTimeUntilStream,
  hasStreamingConfig,
  isHybridSession,
  isOnlineOnly,
  isParticipantLinkValid,
  isValidStreamingUrl,
  platformSupportsEmbed,
  validateAccessConfig,
  validatePlatformUrl,
  validateStreamingConfig
} from './streaming-link'

// Test fixtures
const createConfig = (overrides?: Partial<StreamingConfig>): StreamingConfig => ({
  platform: 'youtube',
  streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  accessLevel: 'public',
  allowEmbed: true,
  ...overrides
})

const createParticipantLink = (
  overrides?: Partial<ParticipantStreamingLink>
): ParticipantStreamingLink => ({
  id: 'link-001',
  sessionId: 'session-001',
  participantId: 'participant-001',
  uniqueToken: 'abcdefghijklmnopqrstuvwxyz012345',
  streamUrl: 'https://example.com/stream/unique-link',
  accessCount: 0,
  maxAccess: 3,
  createdAt: new Date('2025-06-15T08:00:00Z'),
  updatedAt: new Date('2025-06-15T08:00:00Z'),
  ...overrides
})

describe('Streaming Platform Detection', () => {
  describe('detectPlatformFromUrl', () => {
    it('should detect YouTube', () => {
      expect(detectPlatformFromUrl('https://www.youtube.com/watch?v=abc123')).toBe('youtube')
      expect(detectPlatformFromUrl('https://youtu.be/abc123')).toBe('youtube')
    })

    it('should detect Twitch', () => {
      expect(detectPlatformFromUrl('https://www.twitch.tv/channel')).toBe('twitch')
      expect(detectPlatformFromUrl('https://twitch.tv/channel')).toBe('twitch')
    })

    it('should detect Zoom', () => {
      expect(detectPlatformFromUrl('https://zoom.us/j/123456789')).toBe('zoom')
      expect(detectPlatformFromUrl('https://company.zoom.us/j/123456789')).toBe('zoom')
    })

    it('should detect Microsoft Teams', () => {
      expect(detectPlatformFromUrl('https://teams.microsoft.com/l/meetup-join/...')).toBe('teams')
      expect(detectPlatformFromUrl('https://teams.live.com/meet/123')).toBe('teams')
    })

    it('should detect Google Meet', () => {
      expect(detectPlatformFromUrl('https://meet.google.com/abc-defg-hij')).toBe('meet')
    })

    it('should detect Webex', () => {
      expect(detectPlatformFromUrl('https://company.webex.com/meet/user')).toBe('webex')
      expect(detectPlatformFromUrl('https://webex.com/meeting/123')).toBe('webex')
    })

    it('should detect Vimeo', () => {
      expect(detectPlatformFromUrl('https://vimeo.com/123456789')).toBe('vimeo')
      expect(detectPlatformFromUrl('https://player.vimeo.com/video/123456789')).toBe('vimeo')
    })

    it('should return custom for unknown URLs', () => {
      expect(detectPlatformFromUrl('https://example.com/stream')).toBe('custom')
      expect(detectPlatformFromUrl('https://livestream.com/watch')).toBe('custom')
    })
  })

  describe('validatePlatformUrl', () => {
    it('should validate correct YouTube URL', () => {
      expect(validatePlatformUrl('https://www.youtube.com/watch?v=abc', 'youtube')).toBe(true)
    })

    it('should reject incorrect platform URL', () => {
      expect(validatePlatformUrl('https://twitch.tv/channel', 'youtube')).toBe(false)
    })

    it('should validate custom URLs', () => {
      expect(validatePlatformUrl('https://any-valid-url.com/stream', 'custom')).toBe(true)
    })
  })

  describe('isValidStreamingUrl', () => {
    it('should accept https URLs', () => {
      expect(isValidStreamingUrl('https://example.com/stream')).toBe(true)
    })

    it('should accept http URLs', () => {
      expect(isValidStreamingUrl('http://example.com/stream')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidStreamingUrl('not-a-url')).toBe(false)
      expect(isValidStreamingUrl('ftp://example.com')).toBe(false)
    })
  })
})

describe('Embed URL Generation', () => {
  describe('platformSupportsEmbed', () => {
    it('should return true for embeddable platforms', () => {
      expect(platformSupportsEmbed('youtube')).toBe(true)
      expect(platformSupportsEmbed('twitch')).toBe(true)
      expect(platformSupportsEmbed('vimeo')).toBe(true)
    })

    it('should return false for non-embeddable platforms', () => {
      expect(platformSupportsEmbed('zoom')).toBe(false)
      expect(platformSupportsEmbed('teams')).toBe(false)
      expect(platformSupportsEmbed('meet')).toBe(false)
      expect(platformSupportsEmbed('custom')).toBe(false)
    })
  })

  describe('getEmbedUrl', () => {
    it('should generate YouTube embed URL', () => {
      const embedUrl = getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('should generate YouTube embed URL from short URL', () => {
      const embedUrl = getEmbedUrl('https://youtu.be/dQw4w9WgXcQ')
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('should generate Twitch embed URL', () => {
      const embedUrl = getEmbedUrl('https://twitch.tv/channelname')
      expect(embedUrl).toContain('player.twitch.tv')
      expect(embedUrl).toContain('channel=channelname')
    })

    it('should generate Vimeo embed URL', () => {
      const embedUrl = getEmbedUrl('https://vimeo.com/123456789')
      expect(embedUrl).toBe('https://player.vimeo.com/video/123456789')
    })

    it('should return null for non-embeddable platforms', () => {
      expect(getEmbedUrl('https://zoom.us/j/123456789')).toBe(null)
      expect(getEmbedUrl('https://meet.google.com/abc-defg-hij')).toBe(null)
    })

    it('should return null for invalid URLs', () => {
      expect(getEmbedUrl('https://youtube.com/invalid')).toBe(null)
    })
  })

  describe('extractStreamId', () => {
    it('should extract YouTube video ID', () => {
      expect(extractStreamId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractStreamId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('should extract Twitch channel name', () => {
      expect(extractStreamId('https://twitch.tv/channelname')).toBe('channelname')
    })

    it('should extract Vimeo video ID', () => {
      expect(extractStreamId('https://vimeo.com/123456789')).toBe('123456789')
    })

    it('should extract Zoom meeting ID', () => {
      expect(extractStreamId('https://zoom.us/j/123456789')).toBe('123456789')
    })

    it('should extract Google Meet code', () => {
      expect(extractStreamId('https://meet.google.com/abc-defg-hij')).toBe('abc-defg-hij')
    })

    it('should return null for custom URLs', () => {
      expect(extractStreamId('https://example.com/stream')).toBe(null)
    })
  })
})

describe('Access Control', () => {
  describe('canAccessStream', () => {
    it('should allow public access', () => {
      const config = createConfig({ accessLevel: 'public' })
      const result = canAccessStream(config, {})
      expect(result.allowed).toBe(true)
    })

    it('should allow registered users for registered-only streams', () => {
      const config = createConfig({ accessLevel: 'registered' })
      const result = canAccessStream(config, { isRegistered: true })
      expect(result.allowed).toBe(true)
    })

    it('should deny non-registered users for registered-only streams', () => {
      const config = createConfig({ accessLevel: 'registered' })
      const result = canAccessStream(config, { isRegistered: false })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Registration required')
    })

    it('should allow access with correct password', () => {
      const config = createConfig({ accessLevel: 'password', password: 'secret123' })
      const result = canAccessStream(config, { providedPassword: 'secret123' })
      expect(result.allowed).toBe(true)
    })

    it('should deny access with wrong password', () => {
      const config = createConfig({ accessLevel: 'password', password: 'secret123' })
      const result = canAccessStream(config, { providedPassword: 'wrong' })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Invalid password')
    })

    it('should deny access without password when required', () => {
      const config = createConfig({ accessLevel: 'password', password: 'secret123' })
      const result = canAccessStream(config, {})
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Password required')
    })

    it('should allow access with unique link', () => {
      const config = createConfig({ accessLevel: 'unique' })
      const result = canAccessStream(config, { hasUniqueLink: true })
      expect(result.allowed).toBe(true)
    })

    it('should deny access without unique link', () => {
      const config = createConfig({ accessLevel: 'unique' })
      const result = canAccessStream(config, { hasUniqueLink: false })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Unique link required')
    })
  })

  describe('validateAccessConfig', () => {
    it('should return no errors for valid public config', () => {
      const config = createConfig({ accessLevel: 'public' })
      expect(validateAccessConfig(config)).toHaveLength(0)
    })

    it('should return error for password access without password', () => {
      const config = createConfig({ accessLevel: 'password', password: undefined })
      const errors = validateAccessConfig(config)
      expect(errors).toContain('Password is required for password-protected streams')
    })

    it('should return no errors for password access with password', () => {
      const config = createConfig({ accessLevel: 'password', password: 'secret' })
      expect(validateAccessConfig(config)).toHaveLength(0)
    })
  })
})

describe('Participant Links', () => {
  describe('isParticipantLinkValid', () => {
    it('should validate unexpired link with available access', () => {
      const link = createParticipantLink({ accessCount: 0, maxAccess: 3 })
      const result = isParticipantLinkValid(link)
      expect(result.valid).toBe(true)
    })

    it('should invalidate expired link', () => {
      const link = createParticipantLink({
        expiresAt: new Date('2020-01-01')
      })
      const result = isParticipantLinkValid(link)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('should invalidate link with max access reached', () => {
      const link = createParticipantLink({
        accessCount: 3,
        maxAccess: 3
      })
      const result = isParticipantLinkValid(link)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Maximum access count reached')
    })

    it('should allow link with remaining access', () => {
      const link = createParticipantLink({
        accessCount: 2,
        maxAccess: 3
      })
      const result = isParticipantLinkValid(link)
      expect(result.valid).toBe(true)
    })
  })

  describe('generateStreamingToken', () => {
    it('should generate 32 character token', () => {
      const token = generateStreamingToken()
      expect(token).toHaveLength(32)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateStreamingToken())
      }
      expect(tokens.size).toBe(100)
    })

    it('should only contain lowercase alphanumeric characters', () => {
      const token = generateStreamingToken()
      expect(token).toMatch(/^[a-z0-9]+$/)
    })
  })
})

describe('Display Functions', () => {
  describe('getPlatformLabel', () => {
    it('should return correct labels', () => {
      expect(getPlatformLabel('youtube')).toBe('YouTube')
      expect(getPlatformLabel('teams')).toBe('Microsoft Teams')
      expect(getPlatformLabel('meet')).toBe('Google Meet')
      expect(getPlatformLabel('custom')).toBe('Custom')
    })
  })

  describe('getAccessLevelLabel', () => {
    it('should return correct labels', () => {
      expect(getAccessLevelLabel('public')).toBe('Public')
      expect(getAccessLevelLabel('registered')).toBe('Registered Users Only')
      expect(getAccessLevelLabel('password')).toBe('Password Protected')
      expect(getAccessLevelLabel('unique')).toBe('Unique Link per Participant')
    })
  })

  describe('getSessionFormatLabel', () => {
    it('should return correct labels', () => {
      expect(getSessionFormatLabel('in_person')).toBe('In-Person')
      expect(getSessionFormatLabel('online')).toBe('Online')
      expect(getSessionFormatLabel('hybrid')).toBe('Hybrid')
    })
  })

  describe('getSessionFormatIcon', () => {
    it('should return correct icons', () => {
      expect(getSessionFormatIcon('in_person')).toBe('users')
      expect(getSessionFormatIcon('online')).toBe('video')
      expect(getSessionFormatIcon('hybrid')).toBe('monitor-smartphone')
    })
  })

  describe('getDisplayStreamUrl', () => {
    it('should show full URL for public streams', () => {
      const config = createConfig({ accessLevel: 'public' })
      expect(getDisplayStreamUrl(config)).toBe(config.streamUrl)
    })

    it('should mask URL for restricted streams', () => {
      const config = createConfig({ accessLevel: 'registered' })
      const display = getDisplayStreamUrl(config)
      expect(display).toContain('YouTube')
      expect(display).toContain('access restricted')
    })

    it('should show full URL when explicitly requested', () => {
      const config = createConfig({ accessLevel: 'password', password: 'secret' })
      expect(getDisplayStreamUrl(config, { showFull: true })).toBe(config.streamUrl)
    })
  })
})

describe('Countdown Functions', () => {
  describe('getTimeUntilStream', () => {
    it('should return live now for past times', () => {
      const pastTime = new Date(Date.now() - 60000) // 1 minute ago
      const result = getTimeUntilStream(pastTime)
      expect(result.isLive).toBe(true)
      expect(result.formatted).toBe('Live now')
    })

    it('should return isPast for times more than 1 hour ago', () => {
      const pastTime = new Date(Date.now() - 3700000) // > 1 hour ago
      const result = getTimeUntilStream(pastTime)
      expect(result.isPast).toBe(true)
    })

    it('should calculate days correctly', () => {
      const futureTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000) // 2 days 3 hours
      const result = getTimeUntilStream(futureTime)
      expect(result.timeRemaining.days).toBe(2)
      expect(result.formatted).toContain('2d')
    })

    it('should calculate hours correctly', () => {
      const futureTime = new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000) // 5 hours 30 minutes
      const result = getTimeUntilStream(futureTime)
      expect(result.timeRemaining.hours).toBe(5)
      expect(result.formatted).toContain('5h')
    })

    it('should calculate minutes correctly', () => {
      const futureTime = new Date(Date.now() + 45 * 60 * 1000) // 45 minutes
      const result = getTimeUntilStream(futureTime)
      expect(result.timeRemaining.minutes).toBe(45)
      expect(result.formatted).toContain('45m')
    })
  })

  describe('formatStreamingTime', () => {
    it('should format date with timezone', () => {
      const date = new Date('2025-06-15T14:30:00Z')
      const formatted = formatStreamingTime(date, 'Europe/Paris')
      expect(formatted).toContain('Jun')
      expect(formatted).toContain('15')
    })
  })
})

describe('Session Streaming Helpers', () => {
  describe('hasStreamingConfig', () => {
    it('should return true for online session with streaming', () => {
      const session = {
        format: 'online' as SessionFormat,
        streaming: createConfig()
      }
      expect(hasStreamingConfig(session)).toBe(true)
    })

    it('should return true for hybrid session with streaming', () => {
      const session = {
        format: 'hybrid' as SessionFormat,
        streaming: createConfig()
      }
      expect(hasStreamingConfig(session)).toBe(true)
    })

    it('should return false for in-person session', () => {
      const session = {
        format: 'in_person' as SessionFormat,
        streaming: createConfig()
      }
      expect(hasStreamingConfig(session)).toBe(false)
    })

    it('should return false for online session without streaming URL', () => {
      const session = {
        format: 'online' as SessionFormat,
        streaming: { ...createConfig(), streamUrl: '' }
      }
      expect(hasStreamingConfig(session)).toBe(false)
    })

    it('should return false for session without streaming config', () => {
      const session = {
        format: 'online' as SessionFormat
      }
      expect(hasStreamingConfig(session)).toBe(false)
    })
  })

  describe('isOnlineOnly', () => {
    it('should return true for online format', () => {
      expect(isOnlineOnly({ format: 'online' })).toBe(true)
    })

    it('should return false for hybrid format', () => {
      expect(isOnlineOnly({ format: 'hybrid' })).toBe(false)
    })

    it('should return false for in-person format', () => {
      expect(isOnlineOnly({ format: 'in_person' })).toBe(false)
    })
  })

  describe('isHybridSession', () => {
    it('should return true for hybrid format', () => {
      expect(isHybridSession({ format: 'hybrid' })).toBe(true)
    })

    it('should return false for online format', () => {
      expect(isHybridSession({ format: 'online' })).toBe(false)
    })
  })
})

describe('Validation Functions', () => {
  describe('validateStreamingConfig', () => {
    it('should validate correct config', () => {
      const config = createConfig()
      expect(() => validateStreamingConfig(config)).not.toThrow()
    })

    it('should reject invalid URL', () => {
      expect(() =>
        validateStreamingConfig({
          platform: 'youtube',
          streamUrl: 'not-a-url',
          accessLevel: 'public'
        })
      ).toThrow()
    })

    it('should use defaults for optional fields', () => {
      const config = validateStreamingConfig({
        streamUrl: 'https://example.com/stream'
      })
      expect(config.platform).toBe('custom')
      expect(config.accessLevel).toBe('public')
      expect(config.allowEmbed).toBe(false)
    })
  })
})

describe('Create Streaming Config From URL', () => {
  describe('createStreamingConfigFromUrl', () => {
    it('should auto-detect YouTube platform', () => {
      const config = createStreamingConfigFromUrl('https://www.youtube.com/watch?v=abc123')
      expect(config.platform).toBe('youtube')
      expect(config.allowEmbed).toBe(true)
      expect(config.meetingId).toBe('abc123')
    })

    it('should auto-detect Zoom platform', () => {
      const config = createStreamingConfigFromUrl('https://zoom.us/j/123456789')
      expect(config.platform).toBe('zoom')
      expect(config.allowEmbed).toBe(false)
      expect(config.meetingId).toBe('123456789')
    })

    it('should preserve custom options', () => {
      const config = createStreamingConfigFromUrl('https://example.com/stream', {
        accessLevel: 'password',
        password: 'secret',
        scheduledStartTime: new Date('2025-06-15T14:00:00Z')
      })
      expect(config.accessLevel).toBe('password')
      expect(config.password).toBe('secret')
      expect(config.scheduledStartTime).toEqual(new Date('2025-06-15T14:00:00Z'))
    })

    it('should use custom platform for unknown URLs', () => {
      const config = createStreamingConfigFromUrl('https://custom-streaming.com/live')
      expect(config.platform).toBe('custom')
      expect(config.allowEmbed).toBe(false)
    })
  })
})
