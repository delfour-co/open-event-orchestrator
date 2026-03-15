import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmailEventRepository } from './email-event-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeEmailEventRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'ee1',
  campaignId: 'camp1',
  contactId: 'contact1',
  type: 'sent',
  url: 'https://example.com/link',
  linkId: 'link1',
  bounceType: null,
  bounceReason: null,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  timestamp: '2024-06-15T10:00:00Z',
  created: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('EmailEventRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create an email event and map the result', async () => {
      const record = makeEmailEventRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        campaignId: 'camp1',
        contactId: 'contact1',
        type: 'sent',
        url: 'https://example.com/link',
        timestamp: new Date('2024-06-15T10:00:00Z')
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_events')
      expect(result.id).toBe('ee1')
      expect(result.type).toBe('sent')
      expect(result.timestamp).toEqual(new Date('2024-06-15T10:00:00Z'))
    })

    it('should set optional fields to null when not provided', async () => {
      const record = makeEmailEventRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      await repo.create({
        campaignId: 'camp1',
        contactId: 'contact1',
        type: 'sent'
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          url: null,
          linkId: null,
          bounceType: null,
          bounceReason: null,
          ipAddress: null,
          userAgent: null
        })
      )
    })

    it('should use current time when timestamp not provided', async () => {
      const record = makeEmailEventRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      await repo.create({
        campaignId: 'camp1',
        contactId: 'contact1',
        type: 'sent'
      } as never)

      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.timestamp).toBeDefined()
    })
  })

  describe('findById', () => {
    it('should return email event when found', async () => {
      const record = makeEmailEventRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('ee1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('ee1')
      expect(result?.campaignId).toBe('camp1')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should map all fields correctly', async () => {
      const record = makeEmailEventRecord({
        bounceType: 'hard',
        bounceReason: 'Invalid address'
      })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('ee1')

      expect(result?.bounceType).toBe('hard')
      expect(result?.bounceReason).toBe('Invalid address')
      expect(result?.url).toBe('https://example.com/link')
      expect(result?.ipAddress).toBe('192.168.1.1')
    })
  })

  describe('findByCampaign', () => {
    it('should return events filtered by campaignId', async () => {
      const records = [makeEmailEventRecord({ id: 'ee1' }), makeEmailEventRecord({ id: 'ee2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCampaign('camp1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('camp1'),
          sort: '-timestamp'
        })
      )
    })

    it('should return empty array when no events', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCampaign('camp-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByContact', () => {
    it('should return events filtered by contactId', async () => {
      const records = [makeEmailEventRecord()]
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records)
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContact('contact1')

      expect(result).toHaveLength(1)
    })

    it('should return empty array when no events for contact', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByContact('contact-empty')

      expect(result).toEqual([])
    })
  })

  describe('findByCampaignAndContact', () => {
    it('should return events filtered by both campaignId and contactId', async () => {
      const records = [makeEmailEventRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCampaignAndContact('camp1', 'contact1')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('camp1')
        })
      )
    })
  })

  describe('findByCampaignAndType', () => {
    it('should return events filtered by campaignId and type', async () => {
      const records = [makeEmailEventRecord({ type: 'opened' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCampaignAndType('camp1', 'opened')

      expect(result).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('opened')
        })
      )
    })
  })

  describe('countByCampaign', () => {
    it('should return total items count', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 150 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByCampaign('camp1')

      expect(result).toBe(150)
    })

    it('should return zero when no events', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 0 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByCampaign('camp-empty')

      expect(result).toBe(0)
    })
  })

  describe('countByCampaignAndType', () => {
    it('should return count for specific type', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 42 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByCampaignAndType('camp1', 'opened')

      expect(result).toBe(42)
    })
  })

  describe('hasOpenedCampaign', () => {
    it('should return true when contact has opened campaign', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 1 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.hasOpenedCampaign('camp1', 'contact1')

      expect(result).toBe(true)
    })

    it('should return false when contact has not opened campaign', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 0 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.hasOpenedCampaign('camp1', 'contact1')

      expect(result).toBe(false)
    })
  })

  describe('hasClickedCampaign', () => {
    it('should return true when contact has clicked', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 3 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.hasClickedCampaign('camp1', 'contact1')

      expect(result).toBe(true)
    })

    it('should return false when contact has not clicked', async () => {
      mockPb._mockCollection.mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 0 })
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      const result = await repo.hasClickedCampaign('camp1', 'contact1')

      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete email event by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      await repo.delete('ee1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('email_events')
      expect(mockDelete).toHaveBeenCalledWith('ee1')
    })
  })

  describe('deleteByCampaign', () => {
    it('should delete all events for a campaign', async () => {
      const records = [{ id: 'ee1' }, { id: 'ee2' }, { id: 'ee3' }]
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue(records),
        delete: mockDelete
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      await repo.deleteByCampaign('camp1')

      expect(mockDelete).toHaveBeenCalledTimes(3)
      expect(mockDelete).toHaveBeenCalledWith('ee1')
      expect(mockDelete).toHaveBeenCalledWith('ee2')
      expect(mockDelete).toHaveBeenCalledWith('ee3')
    })

    it('should handle empty campaign with no events', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([]),
        delete: vi.fn()
      })

      const repo = createEmailEventRepository(mockPb as unknown as PocketBase)
      await repo.deleteByCampaign('camp-empty')

      // Should not throw and delete should not be called
    })
  })
})
