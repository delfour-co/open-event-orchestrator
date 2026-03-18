import { describe, expect, it, vi } from 'vitest'
import type { AlertLevel, ComparisonOperator, MetricSource } from '../domain/alert-threshold'
import { createAlertThresholdRepository } from './alert-threshold-repository'

const NOW = new Date().toISOString()

const createMockRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'th-1',
  editionId: 'ed-1',
  name: 'Low Sales Alert',
  description: 'Alert when sales are low',
  metricSource: 'billing_sales',
  operator: 'lt',
  thresholdValue: 50,
  level: 'warning',
  enabled: true,
  notifyByEmail: false,
  notifyInApp: true,
  emailRecipients: JSON.stringify(['admin@example.com']),
  created: NOW,
  updated: NOW,
  ...overrides
})

const createMockPocketBase = () => {
  const mockRecord = createMockRecord()
  return {
    collection: vi.fn().mockReturnValue({
      getOne: vi.fn().mockResolvedValue(mockRecord),
      getList: vi.fn().mockResolvedValue({ items: [mockRecord], totalItems: 1, totalPages: 1 }),
      getFullList: vi.fn().mockResolvedValue([mockRecord]),
      create: vi.fn().mockResolvedValue(mockRecord),
      update: vi.fn().mockResolvedValue(mockRecord),
      delete: vi.fn().mockResolvedValue(undefined)
    }),
    mockRecord
  }
}

describe('createAlertThresholdRepository', () => {
  describe('findById', () => {
    it('returns threshold when found', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      const result = await repo.findById('th-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('th-1')
      expect(result?.name).toBe('Low Sales Alert')
      expect(result?.operator).toBe('lt')
    })

    it('returns null when not found', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      const result = await repo.findById('invalid')

      expect(result).toBeNull()
    })

    it('parses emailRecipients from JSON string', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      const result = await repo.findById('th-1')

      expect(result?.emailRecipients).toEqual(['admin@example.com'])
    })

    it('parses emailRecipients from array directly', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi
            .fn()
            .mockResolvedValue(createMockRecord({ emailRecipients: ['user@test.com'] }))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      const result = await repo.findById('th-1')

      expect(result?.emailRecipients).toEqual(['user@test.com'])
    })

    it('defaults emailRecipients to empty array when null', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(createMockRecord({ emailRecipients: null }))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      const result = await repo.findById('th-1')

      expect(result?.emailRecipients).toEqual([])
    })

    it('defaults emailRecipients on invalid JSON', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(createMockRecord({ emailRecipients: 'not-valid-json' }))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      const result = await repo.findById('th-1')

      expect(result?.emailRecipients).toEqual([])
    })
  })

  describe('findByEdition', () => {
    it('returns thresholds for edition', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      const results = await repo.findByEdition('ed-1')

      expect(results).toHaveLength(1)
      expect(results[0].editionId).toBe('ed-1')
    })

    it('filters by enabled when enabledOnly is set', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      await repo.findByEdition('ed-1', { enabledOnly: true })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('enabled = true')
        })
      )
    })

    it('uses custom pagination', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      await repo.findByEdition('ed-1', { page: 3, perPage: 25, sort: 'name' })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        3,
        25,
        expect.objectContaining({ sort: 'name' })
      )
    })
  })

  describe('findByMetricSource', () => {
    it('returns enabled thresholds for metric source', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      const results = await repo.findByMetricSource('ed-1', 'billing_sales' as MetricSource)

      expect(results).toHaveLength(1)
      expect(collection().getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('billing_sales'),
          sort: 'level'
        })
      )
    })
  })

  describe('create', () => {
    it('creates threshold with JSON-serialized emailRecipients', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.create({
        editionId: 'ed-1',
        name: 'New Threshold',
        metricSource: 'billing_sales' as MetricSource,
        operator: 'lt' as ComparisonOperator,
        thresholdValue: 100,
        level: 'critical' as AlertLevel,
        enabled: true,
        notifyByEmail: true,
        notifyInApp: true,
        emailRecipients: ['test@example.com']
      })

      expect(collection().create).toHaveBeenCalledWith(
        expect.objectContaining({
          emailRecipients: JSON.stringify(['test@example.com'])
        })
      )
    })

    it('defaults emailRecipients to empty array', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.create({
        editionId: 'ed-1',
        name: 'New Threshold',
        metricSource: 'billing_sales' as MetricSource,
        operator: 'lt' as ComparisonOperator,
        thresholdValue: 100,
        level: 'critical' as AlertLevel,
        enabled: true,
        notifyByEmail: false,
        notifyInApp: true,
        emailRecipients: []
      })

      expect(collection().create).toHaveBeenCalledWith(
        expect.objectContaining({
          emailRecipients: JSON.stringify([])
        })
      )
    })
  })

  describe('update', () => {
    it('updates threshold with JSON-serialized emailRecipients', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.update('th-1', { emailRecipients: ['new@example.com'] })

      expect(collection().update).toHaveBeenCalledWith(
        'th-1',
        expect.objectContaining({
          emailRecipients: JSON.stringify(['new@example.com'])
        })
      )
    })

    it('passes other fields without serialization', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.update('th-1', { name: 'Updated Name', thresholdValue: 200 })

      expect(collection().update).toHaveBeenCalledWith(
        'th-1',
        expect.objectContaining({ name: 'Updated Name', thresholdValue: 200 })
      )
    })
  })

  describe('delete', () => {
    it('deletes threshold', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.delete('th-1')

      expect(collection().delete).toHaveBeenCalledWith('th-1')
    })
  })

  describe('toggleEnabled', () => {
    it('toggles enabled state', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository({ collection } as any)

      await repo.toggleEnabled('th-1', false)

      expect(collection().update).toHaveBeenCalledWith('th-1', { enabled: false })
    })
  })

  describe('countByEdition', () => {
    it('returns total and enabled counts', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi
            .fn()
            .mockResolvedValue([{ enabled: true }, { enabled: true }, { enabled: false }])
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createAlertThresholdRepository(pb as any)

      const result = await repo.countByEdition('ed-1')

      expect(result.total).toBe(3)
      expect(result.enabled).toBe(2)
    })
  })
})
