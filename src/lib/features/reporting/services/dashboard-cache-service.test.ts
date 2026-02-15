import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type EditionMetrics, createEmptyEditionMetrics } from '../domain/metrics'
import { dashboardCacheService } from './dashboard-cache-service'

describe('DashboardCacheService', () => {
  beforeEach(() => {
    dashboardCacheService.clearAll()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getMetrics / setMetrics', () => {
    it('should return null for uncached edition', () => {
      const result = dashboardCacheService.getMetrics('edition-1')
      expect(result).toBeNull()
    })

    it('should return cached metrics', () => {
      const metrics = createEmptyEditionMetrics()
      metrics.billing.totalRevenue = 1000

      dashboardCacheService.setMetrics('edition-1', metrics)
      const result = dashboardCacheService.getMetrics('edition-1')

      expect(result).not.toBeNull()
      expect(result?.billing.totalRevenue).toBe(1000)
    })

    it('should return null for expired cache', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 1000)

      vi.advanceTimersByTime(1500)

      const result = dashboardCacheService.getMetrics('edition-1')
      expect(result).toBeNull()
    })

    it('should allow custom TTL', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 10000)

      vi.advanceTimersByTime(5000)
      expect(dashboardCacheService.getMetrics('edition-1')).not.toBeNull()

      vi.advanceTimersByTime(6000)
      expect(dashboardCacheService.getMetrics('edition-1')).toBeNull()
    })
  })

  describe('invalidateMetrics', () => {
    it('should remove cached metrics', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics)

      const result = dashboardCacheService.invalidateMetrics('edition-1')

      expect(result).toBe(true)
      expect(dashboardCacheService.getMetrics('edition-1')).toBeNull()
    })

    it('should return false for non-existent entry', () => {
      const result = dashboardCacheService.invalidateMetrics('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('hasMetrics', () => {
    it('should return true for cached metrics', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics)

      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(true)
    })

    it('should return false for uncached metrics', () => {
      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(false)
    })

    it('should return false for expired metrics', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 1000)

      vi.advanceTimersByTime(1500)

      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(false)
    })
  })

  describe('getMetricsEntry', () => {
    it('should return entry with metadata', () => {
      const now = Date.now()
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 5000)

      const entry = dashboardCacheService.getMetricsEntry('edition-1')

      expect(entry).not.toBeNull()
      expect(entry?.data).toEqual(metrics)
      expect(entry?.cachedAt).toBe(now)
      expect(entry?.expiresAt).toBe(now + 5000)
    })

    it('should return null for expired entry', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 1000)

      vi.advanceTimersByTime(1500)

      expect(dashboardCacheService.getMetricsEntry('edition-1')).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('should remove all cached entries', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics)
      dashboardCacheService.setMetrics('edition-2', metrics)

      dashboardCacheService.clearAll()

      expect(dashboardCacheService.getMetrics('edition-1')).toBeNull()
      expect(dashboardCacheService.getMetrics('edition-2')).toBeNull()
      expect(dashboardCacheService.size()).toBe(0)
    })
  })

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const metrics = createEmptyEditionMetrics()
      dashboardCacheService.setMetrics('edition-1', metrics, 1000)
      dashboardCacheService.setMetrics('edition-2', metrics, 5000)

      vi.advanceTimersByTime(2000)

      const removed = dashboardCacheService.cleanup()

      expect(removed).toBe(1)
      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(false)
      expect(dashboardCacheService.hasMetrics('edition-2')).toBe(true)
    })
  })

  describe('size', () => {
    it('should return the number of cached entries', () => {
      const metrics = createEmptyEditionMetrics()

      expect(dashboardCacheService.size()).toBe(0)

      dashboardCacheService.setMetrics('edition-1', metrics)
      expect(dashboardCacheService.size()).toBe(1)

      dashboardCacheService.setMetrics('edition-2', metrics)
      expect(dashboardCacheService.size()).toBe(2)
    })
  })

  describe('getOrFetch', () => {
    it('should return cached metrics without calling fetcher', async () => {
      const metrics = createEmptyEditionMetrics()
      metrics.billing.totalRevenue = 500
      dashboardCacheService.setMetrics('edition-1', metrics)

      const fetcher = vi.fn()

      const result = await dashboardCacheService.getOrFetch('edition-1', fetcher)

      expect(result.billing.totalRevenue).toBe(500)
      expect(fetcher).not.toHaveBeenCalled()
    })

    it('should call fetcher and cache result when not cached', async () => {
      const metrics = createEmptyEditionMetrics()
      metrics.billing.totalRevenue = 1000

      const fetcher = vi.fn().mockResolvedValue(metrics)

      const result = await dashboardCacheService.getOrFetch('edition-1', fetcher)

      expect(result.billing.totalRevenue).toBe(1000)
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(true)
    })

    it('should use custom TTL when provided', async () => {
      const metrics = createEmptyEditionMetrics()
      const fetcher = vi.fn().mockResolvedValue(metrics)

      await dashboardCacheService.getOrFetch('edition-1', fetcher, 2000)

      vi.advanceTimersByTime(1500)
      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(true)

      vi.advanceTimersByTime(1000)
      expect(dashboardCacheService.hasMetrics('edition-1')).toBe(false)
    })
  })
})
