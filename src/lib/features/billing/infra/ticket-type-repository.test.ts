import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTicketTypeRepository } from './ticket-type-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && ')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'tt1',
  editionId: 'edition1',
  name: 'VIP Pass',
  description: 'VIP access',
  price: 99,
  currency: 'EUR',
  quantity: 100,
  quantitySold: 10,
  salesStartDate: '2024-01-01T00:00:00Z',
  salesEndDate: '2024-06-01T00:00:00Z',
  isActive: true,
  order: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('TicketTypeRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createTicketTypeRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a ticket type when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('tt1')

      expect(mockPb.collection).toHaveBeenCalledWith('ticket_types')
      expect(result?.id).toBe('tt1')
      expect(result?.name).toBe('VIP Pass')
      expect(result?.price).toBe(99)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return ticket types sorted by order,name', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'order,name'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findActiveByEdition', () => {
    it('should return only active ticket types', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findActiveByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('isActive = true'),
        sort: 'order,price'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a ticket type with quantitySold=0 and serialized dates', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-06-01')

      await getRepo().create({
        editionId: 'edition1',
        name: 'VIP Pass',
        price: 99,
        currency: 'EUR',
        quantity: 100,
        isActive: true,
        salesStartDate: startDate,
        salesEndDate: endDate
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantitySold: 0,
          salesStartDate: startDate.toISOString(),
          salesEndDate: endDate.toISOString()
        })
      )
    })

    it('should handle null dates', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      await getRepo().create({
        editionId: 'edition1',
        name: 'Free',
        price: 0,
        currency: 'EUR',
        quantity: 50,
        isActive: true
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          salesStartDate: null,
          salesEndDate: null
        })
      )
    })
  })

  describe('update', () => {
    it('should serialize date fields when provided', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      const newDate = new Date('2024-07-01')

      await getRepo().update('tt1', { salesStartDate: newDate })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.salesStartDate).toBe(newDate.toISOString())
    })

    it('should not touch dates when not in update data', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)

      await getRepo().update('tt1', { name: 'Updated' })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.name).toBe('Updated')
      expect(callArgs).not.toHaveProperty('salesStartDate')
    })
  })

  describe('delete', () => {
    it('should delete the ticket type', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('tt1')

      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('tt1')
    })
  })

  describe('incrementQuantitySold', () => {
    it('should increment quantitySold by the given amount', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({ ...MOCK_RECORD, quantitySold: 10 })
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, quantitySold: 13 })

      const result = await getRepo().incrementQuantitySold('tt1', 3)

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('tt1', { quantitySold: 13 })
      expect(result.quantitySold).toBe(13)
    })
  })

  describe('mapping', () => {
    it('should map dates and defaults correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        ...MOCK_RECORD,
        currency: '',
        quantitySold: 0,
        salesStartDate: null,
        salesEndDate: null,
        order: 0
      })
      const result = await getRepo().findById('tt1')

      expect(result?.currency).toBe('EUR')
      expect(result?.quantitySold).toBe(0)
      expect(result?.salesStartDate).toBeUndefined()
      expect(result?.salesEndDate).toBeUndefined()
      expect(result?.createdAt).toBeInstanceOf(Date)
    })
  })
})
