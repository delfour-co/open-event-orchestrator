import type { EditionMetrics } from '../domain/metrics'

type CacheEntry<T> = {
  data: T
  cachedAt: number
  expiresAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

export type DashboardCacheConfig = {
  ttlMs?: number
  maxEntries?: number
}

const createCache = <T>() => {
  const cache = new Map<string, CacheEntry<T>>()

  return {
    get: (key: string): T | null => {
      const entry = cache.get(key)
      if (!entry) return null

      if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
      }

      return entry.data
    },

    set: (key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void => {
      const now = Date.now()
      cache.set(key, {
        data,
        cachedAt: now,
        expiresAt: now + ttlMs
      })
    },

    delete: (key: string): boolean => {
      return cache.delete(key)
    },

    clear: (): void => {
      cache.clear()
    },

    has: (key: string): boolean => {
      const entry = cache.get(key)
      if (!entry) return false

      if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return false
      }

      return true
    },

    getEntry: (key: string): CacheEntry<T> | null => {
      const entry = cache.get(key)
      if (!entry) return null

      if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
      }

      return entry
    },

    size: (): number => cache.size,

    cleanup: (): number => {
      const now = Date.now()
      let removed = 0

      for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
          cache.delete(key)
          removed++
        }
      }

      return removed
    }
  }
}

const metricsCache = createCache<EditionMetrics>()

export const dashboardCacheService = {
  /**
   * Get cached metrics for an edition
   */
  getMetrics(editionId: string): EditionMetrics | null {
    return metricsCache.get(`metrics:${editionId}`)
  },

  /**
   * Cache metrics for an edition
   */
  setMetrics(editionId: string, metrics: EditionMetrics, ttlMs?: number): void {
    metricsCache.set(`metrics:${editionId}`, metrics, ttlMs ?? DEFAULT_TTL_MS)
  },

  /**
   * Invalidate cached metrics for an edition
   */
  invalidateMetrics(editionId: string): boolean {
    return metricsCache.delete(`metrics:${editionId}`)
  },

  /**
   * Check if metrics are cached for an edition
   */
  hasMetrics(editionId: string): boolean {
    return metricsCache.has(`metrics:${editionId}`)
  },

  /**
   * Get cache entry with metadata (cachedAt, expiresAt)
   */
  getMetricsEntry(editionId: string): CacheEntry<EditionMetrics> | null {
    return metricsCache.getEntry(`metrics:${editionId}`)
  },

  /**
   * Clear all cached data
   */
  clearAll(): void {
    metricsCache.clear()
  },

  /**
   * Remove expired entries
   */
  cleanup(): number {
    return metricsCache.cleanup()
  },

  /**
   * Get the number of cached entries
   */
  size(): number {
    return metricsCache.size()
  },

  /**
   * Get or fetch metrics with cache
   */
  async getOrFetch(
    editionId: string,
    fetcher: () => Promise<EditionMetrics>,
    ttlMs?: number
  ): Promise<EditionMetrics> {
    const cached = this.getMetrics(editionId)
    if (cached) return cached

    const metrics = await fetcher()
    this.setMetrics(editionId, metrics, ttlMs)
    return metrics
  }
}
