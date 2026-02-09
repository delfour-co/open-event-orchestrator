import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiKey } from '../domain'
import { createRateLimiterService } from './rate-limiter-service'

describe('RateLimiterService', () => {
  let rateLimiter: ReturnType<typeof createRateLimiterService>

  const createMockApiKey = (overrides?: Partial<ApiKey>): ApiKey => ({
    id: 'key-1',
    name: 'Test Key',
    keyHash: 'hash123',
    keyPrefix: 'oeo_live_ab',
    permissions: ['read:events'],
    rateLimit: 60,
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = createRateLimiterService()
    rateLimiter.resetAll()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('check', () => {
    it('should allow request when under rate limit', () => {
      const apiKey = createMockApiKey({ rateLimit: 60 })

      const result = rateLimiter.check(apiKey)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(59)
      expect(result.limit).toBe(60)
    })

    it('should deny request when rate limit is exceeded', () => {
      const apiKey = createMockApiKey({ rateLimit: 2 })

      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)
      const result = rateLimiter.check(apiKey)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset counter after window expires', () => {
      const apiKey = createMockApiKey({ rateLimit: 2 })

      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)

      // Advance time by 61 seconds (past the 60s window)
      vi.advanceTimersByTime(61000)

      const result = rateLimiter.check(apiKey)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should track requests separately per API key', () => {
      const apiKey1 = createMockApiKey({ id: 'key-1', rateLimit: 2 })
      const apiKey2 = createMockApiKey({ id: 'key-2', rateLimit: 2 })

      rateLimiter.check(apiKey1)
      rateLimiter.check(apiKey1)

      const result1 = rateLimiter.check(apiKey1)
      const result2 = rateLimiter.check(apiKey2)

      expect(result1.allowed).toBe(false)
      expect(result2.allowed).toBe(true)
    })

    it('should return correct resetAt time', () => {
      const apiKey = createMockApiKey()
      const startTime = new Date()
      vi.setSystemTime(startTime)

      const result = rateLimiter.check(apiKey)

      expect(result.resetAt.getTime()).toBe(startTime.getTime() + 60000)
    })
  })

  describe('consume', () => {
    it('should be an alias for check', () => {
      const apiKey = createMockApiKey({ rateLimit: 60 })

      const result = rateLimiter.consume(apiKey)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(59)
    })
  })

  describe('getRemainingRequests', () => {
    it('should return full limit when no requests made', () => {
      const apiKey = createMockApiKey({ rateLimit: 60 })

      const remaining = rateLimiter.getRemainingRequests(apiKey)

      expect(remaining).toBe(60)
    })

    it('should return remaining after some requests', () => {
      const apiKey = createMockApiKey({ rateLimit: 60 })

      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)

      const remaining = rateLimiter.getRemainingRequests(apiKey)

      expect(remaining).toBe(57)
    })

    it('should return full limit after window expires', () => {
      const apiKey = createMockApiKey({ rateLimit: 60 })

      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)

      vi.advanceTimersByTime(61000)

      const remaining = rateLimiter.getRemainingRequests(apiKey)

      expect(remaining).toBe(60)
    })
  })

  describe('getResetTime', () => {
    it('should return future reset time when no requests made', () => {
      const apiKey = createMockApiKey()
      const now = new Date()
      vi.setSystemTime(now)

      const resetTime = rateLimiter.getResetTime(apiKey)

      expect(resetTime.getTime()).toBe(now.getTime() + 60000)
    })

    it('should return window end time after requests made', () => {
      const apiKey = createMockApiKey()
      const startTime = new Date()
      vi.setSystemTime(startTime)

      rateLimiter.check(apiKey)

      vi.advanceTimersByTime(10000) // 10 seconds later

      const resetTime = rateLimiter.getResetTime(apiKey)

      expect(resetTime.getTime()).toBe(startTime.getTime() + 60000)
    })
  })

  describe('reset', () => {
    it('should reset counter for specific API key', () => {
      const apiKey = createMockApiKey({ rateLimit: 2 })

      rateLimiter.check(apiKey)
      rateLimiter.check(apiKey)

      rateLimiter.reset(apiKey)

      const result = rateLimiter.check(apiKey)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should not affect other API keys', () => {
      const apiKey1 = createMockApiKey({ id: 'key-1', rateLimit: 2 })
      const apiKey2 = createMockApiKey({ id: 'key-2', rateLimit: 2 })

      rateLimiter.check(apiKey1)
      rateLimiter.check(apiKey2)

      rateLimiter.reset(apiKey1)

      expect(rateLimiter.getRemainingRequests(apiKey1)).toBe(2)
      expect(rateLimiter.getRemainingRequests(apiKey2)).toBe(1)
    })
  })

  describe('resetAll', () => {
    it('should reset counters for all API keys', () => {
      const apiKey1 = createMockApiKey({ id: 'key-1', rateLimit: 2 })
      const apiKey2 = createMockApiKey({ id: 'key-2', rateLimit: 2 })

      rateLimiter.check(apiKey1)
      rateLimiter.check(apiKey2)

      rateLimiter.resetAll()

      expect(rateLimiter.getRemainingRequests(apiKey1)).toBe(2)
      expect(rateLimiter.getRemainingRequests(apiKey2)).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should handle rate limit of 1', () => {
      const apiKey = createMockApiKey({ rateLimit: 1 })

      const result1 = rateLimiter.check(apiKey)
      const result2 = rateLimiter.check(apiKey)

      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(0)
      expect(result2.allowed).toBe(false)
    })

    it('should handle high rate limits', () => {
      const apiKey = createMockApiKey({ rateLimit: 10000 })

      for (let i = 0; i < 100; i++) {
        rateLimiter.check(apiKey)
      }

      const remaining = rateLimiter.getRemainingRequests(apiKey)

      expect(remaining).toBe(9900)
    })
  })
})
