import type { ApiKey } from '../domain'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

interface RateLimitEntry {
  count: number
  windowStart: number
}

const WINDOW_SIZE_MS = 60 * 1000

const store = new Map<string, RateLimitEntry>()

const cleanupExpiredEntries = (): void => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > WINDOW_SIZE_MS) {
      store.delete(key)
    }
  }
}

setInterval(cleanupExpiredEntries, WINDOW_SIZE_MS)

export const createRateLimiterService = () => {
  return {
    check(apiKey: ApiKey): RateLimitResult {
      const now = Date.now()
      const limit = apiKey.rateLimit
      const key = apiKey.id

      let entry = store.get(key)

      if (!entry || now - entry.windowStart > WINDOW_SIZE_MS) {
        entry = { count: 0, windowStart: now }
        store.set(key, entry)
      }

      const resetAt = new Date(entry.windowStart + WINDOW_SIZE_MS)

      if (entry.count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          limit
        }
      }

      entry.count++
      const remaining = Math.max(0, limit - entry.count)

      return {
        allowed: true,
        remaining,
        resetAt,
        limit
      }
    },

    consume(apiKey: ApiKey): RateLimitResult {
      return this.check(apiKey)
    },

    getRemainingRequests(apiKey: ApiKey): number {
      const key = apiKey.id
      const entry = store.get(key)

      if (!entry) {
        return apiKey.rateLimit
      }

      const now = Date.now()
      if (now - entry.windowStart > WINDOW_SIZE_MS) {
        return apiKey.rateLimit
      }

      return Math.max(0, apiKey.rateLimit - entry.count)
    },

    getResetTime(apiKey: ApiKey): Date {
      const key = apiKey.id
      const entry = store.get(key)

      if (!entry) {
        return new Date(Date.now() + WINDOW_SIZE_MS)
      }

      return new Date(entry.windowStart + WINDOW_SIZE_MS)
    },

    reset(apiKey: ApiKey): void {
      store.delete(apiKey.id)
    },

    resetAll(): void {
      store.clear()
    }
  }
}

export type RateLimiterService = ReturnType<typeof createRateLimiterService>

export const rateLimiter = createRateLimiterService()
