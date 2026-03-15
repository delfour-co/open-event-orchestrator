import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmailCampaignRepository } from './email-campaign-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeCampaignRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'camp1',
  eventId: 'evt1',
  editionId: 'ed1',
  name: 'Welcome Campaign',
  templateId: 'tpl1',
  segmentId: 'seg1',
  subject: 'Welcome!',
  bodyHtml: '<p>Hello</p>',
  bodyText: 'Hello',
  status: 'draft',
  scheduledAt: '2024-06-15T09:00:00Z',
  sentAt: null,
  totalRecipients: 100,
  totalSent: 0,
  totalFailed: 0,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('EmailCampaignRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return campaign when found', async () => {
      const record = makeCampaignRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('camp1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('camp1')
      expect(result?.name).toBe('Welcome Campaign')
      expect(result?.status).toBe('draft')
      expect(result?.totalRecipients).toBe(100)
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse scheduledAt date when present', async () => {
      const record = makeCampaignRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('camp1')

      expect(result?.scheduledAt).toEqual(new Date('2024-06-15T09:00:00Z'))
    })

    it('should set sentAt to undefined when null', async () => {
      const record = makeCampaignRecord({ sentAt: null })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('camp1')

      expect(result?.sentAt).toBeUndefined()
    })

    it('should default status to draft when empty', async () => {
      const record = makeCampaignRecord({ status: '' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('camp1')

      expect(result?.status).toBe('draft')
    })
  })

  describe('findByEvent', () => {
    it('should return campaigns filtered by eventId', async () => {
      const records = [makeCampaignRecord({ id: 'camp1' }), makeCampaignRecord({ id: 'camp2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt1'),
          sort: '-created'
        })
      )
    })

    it('should return empty array when no campaigns', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a campaign with default counters', async () => {
      const record = makeCampaignRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        eventId: 'evt1',
        name: 'Welcome Campaign',
        subject: 'Welcome!',
        bodyHtml: '<p>Hello</p>',
        bodyText: 'Hello',
        status: 'draft'
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_campaigns')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalRecipients: 0,
          totalSent: 0,
          totalFailed: 0
        })
      )
      expect(result.id).toBe('camp1')
    })

    it('should serialize scheduledAt to ISO string', async () => {
      const record = makeCampaignRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const scheduledAt = new Date('2024-06-15T09:00:00Z')
      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.create({
        eventId: 'evt1',
        name: 'Campaign',
        subject: 'Subject',
        bodyHtml: '<p></p>',
        bodyText: '',
        status: 'scheduled',
        scheduledAt
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledAt: scheduledAt.toISOString() })
      )
    })

    it('should set scheduledAt to null when not provided', async () => {
      const record = makeCampaignRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.create({
        eventId: 'evt1',
        name: 'Campaign',
        subject: 'Subject',
        bodyHtml: '<p></p>',
        bodyText: '',
        status: 'draft'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ scheduledAt: null }))
    })
  })

  describe('update', () => {
    it('should update campaign fields', async () => {
      const record = makeCampaignRecord({ name: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('camp1', { name: 'Updated' } as never)

      expect(result.name).toBe('Updated')
    })

    it('should serialize dates when updating', async () => {
      const record = makeCampaignRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const scheduledAt = new Date('2024-07-01T10:00:00Z')
      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.update('camp1', { scheduledAt } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'camp1',
        expect.objectContaining({ scheduledAt: scheduledAt.toISOString() })
      )
    })
  })

  describe('updateStatus', () => {
    it('should update status alone', async () => {
      const record = makeCampaignRecord({ status: 'sending' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      const result = await repo.updateStatus('camp1', 'sending')

      expect(mockUpdate).toHaveBeenCalledWith('camp1', { status: 'sending' })
      expect(result.status).toBe('sending')
    })

    it('should include extra fields when provided', async () => {
      const record = makeCampaignRecord({ status: 'sent' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const sentAt = new Date('2024-06-15T10:00:00Z')
      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('camp1', 'sent', {
        sentAt,
        totalRecipients: 100,
        totalSent: 95,
        totalFailed: 5
      })

      expect(mockUpdate).toHaveBeenCalledWith('camp1', {
        status: 'sent',
        sentAt: sentAt.toISOString(),
        totalRecipients: 100,
        totalSent: 95,
        totalFailed: 5
      })
    })

    it('should not include extra fields when not provided', async () => {
      const record = makeCampaignRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('camp1', 'cancelled')

      expect(mockUpdate).toHaveBeenCalledWith('camp1', { status: 'cancelled' })
    })
  })

  describe('delete', () => {
    it('should delete campaign by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEmailCampaignRepository(mockPb as unknown as PocketBase)
      await repo.delete('camp1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_campaigns')
      expect(mockDelete).toHaveBeenCalledWith('camp1')
    })
  })
})
