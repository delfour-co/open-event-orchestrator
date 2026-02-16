import { describe, expect, it, vi } from 'vitest'
import { createReportConfigRepository } from './report-config-repository'

const createMockPocketBase = () => {
  const mockRecord = {
    id: 'cfg-123',
    editionId: 'ed-456',
    name: 'Weekly Report',
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 'monday',
    dayOfMonth: null,
    timeOfDay: '09:00',
    timezone: 'Europe/Paris',
    recipientRoles: JSON.stringify(['admin', 'organizer']),
    recipients: JSON.stringify([{ email: 'test@example.com', name: 'Test' }]),
    sections: JSON.stringify(['cfp', 'billing']),
    lastSentAt: null,
    nextScheduledAt: new Date().toISOString(),
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }

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

describe('createReportConfigRepository', () => {
  describe('findById', () => {
    it('returns config when found', async () => {
      const { collection, mockRecord } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      const result = await repo.findById('cfg-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe(mockRecord.id)
      expect(result?.name).toBe('Weekly Report')
    })

    it('returns null when not found', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      const result = await repo.findById('invalid')

      expect(result).toBeNull()
    })

    it('parses recipientRoles from JSON string', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      const result = await repo.findById('cfg-123')

      expect(result?.recipientRoles).toEqual(['admin', 'organizer'])
    })

    it('defaults recipientRoles when missing', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue({
            id: 'cfg-123',
            editionId: 'ed-456',
            name: 'Test',
            enabled: true,
            frequency: 'weekly',
            timeOfDay: '09:00',
            recipientRoles: null,
            recipients: '[]',
            sections: '["cfp"]',
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      const result = await repo.findById('cfg-123')

      expect(result?.recipientRoles).toEqual(['admin', 'organizer'])
    })

    it('parses recipientRoles from array directly', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue({
            id: 'cfg-123',
            editionId: 'ed-456',
            name: 'Test',
            enabled: true,
            frequency: 'weekly',
            timeOfDay: '09:00',
            recipientRoles: ['owner', 'admin'],
            recipients: [],
            sections: ['cfp'],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      const result = await repo.findById('cfg-123')

      expect(result?.recipientRoles).toEqual(['owner', 'admin'])
    })
  })

  describe('findByEdition', () => {
    it('returns configs for edition', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      const results = await repo.findByEdition('ed-456')

      expect(results).toHaveLength(1)
      expect(results[0].editionId).toBe('ed-456')
    })

    it('filters by enabled when option is set', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      await repo.findByEdition('ed-456', { enabledOnly: true })

      expect(pb.collection().getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('enabled = true')
        })
      )
    })
  })

  describe('create', () => {
    it('creates config with recipientRoles', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue({
            id: 'new-cfg',
            editionId: 'ed-456',
            name: 'New Report',
            enabled: true,
            frequency: 'daily',
            timeOfDay: '08:00',
            timezone: 'UTC',
            recipientRoles: JSON.stringify(['admin']),
            recipients: '[]',
            sections: '["billing"]',
            nextScheduledAt: new Date().toISOString(),
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      const result = await repo.create({
        editionId: 'ed-456',
        name: 'New Report',
        enabled: true,
        frequency: 'daily',
        timeOfDay: '08:00',
        timezone: 'UTC',
        recipientRoles: ['admin'],
        recipients: [],
        sections: ['billing']
      })

      expect(pb.collection().create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientRoles: JSON.stringify(['admin'])
        })
      )
      expect(result.recipientRoles).toEqual(['admin'])
    })

    it('defaults recipientRoles when not provided', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue({
            id: 'new-cfg',
            editionId: 'ed-456',
            name: 'New Report',
            enabled: true,
            frequency: 'daily',
            timeOfDay: '08:00',
            timezone: 'UTC',
            recipientRoles: JSON.stringify(['admin', 'organizer']),
            recipients: '[]',
            sections: '["billing"]',
            nextScheduledAt: new Date().toISOString(),
            created: new Date().toISOString(),
            updated: new Date().toISOString()
          })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      await repo.create({
        editionId: 'ed-456',
        name: 'New Report',
        enabled: true,
        frequency: 'daily',
        timeOfDay: '08:00',
        timezone: 'UTC',
        recipients: [],
        sections: ['billing']
      })

      expect(pb.collection().create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientRoles: JSON.stringify(['admin', 'organizer'])
        })
      )
    })
  })

  describe('update', () => {
    it('updates recipientRoles', async () => {
      const { collection, mockRecord } = createMockPocketBase()
      collection().update.mockResolvedValue({
        ...mockRecord,
        recipientRoles: JSON.stringify(['owner'])
      })
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      const result = await repo.update('cfg-123', {
        recipientRoles: ['owner']
      })

      expect(collection().update).toHaveBeenCalledWith(
        'cfg-123',
        expect.objectContaining({
          recipientRoles: JSON.stringify(['owner'])
        })
      )
      expect(result.recipientRoles).toEqual(['owner'])
    })
  })

  describe('delete', () => {
    it('deletes config', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      await repo.delete('cfg-123')

      expect(collection().delete).toHaveBeenCalledWith('cfg-123')
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
      const repo = createReportConfigRepository(pb as any)

      const result = await repo.countByEdition('ed-456')

      expect(result.total).toBe(3)
      expect(result.enabled).toBe(2)
    })
  })

  describe('findDueReports', () => {
    it('returns reports due before specified date', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository({ collection } as any)

      const beforeDate = new Date('2024-01-15T10:00:00Z')
      await repo.findDueReports(beforeDate)

      expect(collection().getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('enabled = true'),
          sort: 'nextScheduledAt'
        })
      )
    })
  })

  describe('markSent', () => {
    it('updates lastSentAt and nextScheduledAt', async () => {
      const mockRecord = {
        id: 'cfg-123',
        editionId: 'ed-456',
        name: 'Weekly Report',
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 'monday',
        timeOfDay: '09:00',
        timezone: 'UTC',
        recipientRoles: '["admin"]',
        recipients: '[]',
        sections: '["cfp"]',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }

      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockResolvedValue(mockRecord),
          update: vi.fn().mockResolvedValue({
            ...mockRecord,
            lastSentAt: new Date().toISOString(),
            nextScheduledAt: new Date().toISOString()
          })
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      await repo.markSent('cfg-123')

      expect(pb.collection().update).toHaveBeenCalledWith(
        'cfg-123',
        expect.objectContaining({
          lastSentAt: expect.any(String),
          nextScheduledAt: expect.any(String)
        })
      )
    })

    it('throws when config not found', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getOne: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createReportConfigRepository(pb as any)

      await expect(repo.markSent('invalid')).rejects.toThrow('Report config not found')
    })
  })
})
