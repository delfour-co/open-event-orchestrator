import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTicketRepository } from './ticket-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && ')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getList: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'ticket1',
  orderId: 'order1',
  ticketTypeId: 'tt1',
  editionId: 'edition1',
  attendeeEmail: 'john@example.com',
  attendeeFirstName: 'John',
  attendeeLastName: 'Doe',
  ticketNumber: 'TK-001',
  qrCode: 'qr-data',
  status: 'valid',
  checkedInAt: null,
  checkedInBy: null,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('TicketRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createTicketRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a ticket when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('ticket1')

      expect(mockPb.collection).toHaveBeenCalledWith('billing_tickets')
      expect(mockPb.mockCollection.getOne).toHaveBeenCalledWith('ticket1')
      expect(result?.id).toBe('ticket1')
      expect(result?.attendeeEmail).toBe('john@example.com')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })

    it('should map dates correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('ticket1')

      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
      expect(result?.checkedInAt).toBeUndefined()
    })
  })

  describe('findByOrder', () => {
    it('should return tickets for an order', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByOrder('order1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].orderId).toBe('order1')
    })

    it('should return empty array when no tickets', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().findByOrder('order1')
      expect(result).toHaveLength(0)
    })
  })

  describe('findByEdition', () => {
    it('should return tickets for an edition sorted by -created', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('findByTicketNumber', () => {
    it('should return a ticket when found', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByTicketNumber('TK-001')

      expect(result?.ticketNumber).toBe('TK-001')
    })

    it('should return null when no items', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      const result = await getRepo().findByTicketNumber('TK-999')
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPb.mockCollection.getList.mockRejectedValue(new Error('Error'))
      const result = await getRepo().findByTicketNumber('TK-001')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a ticket with valid status', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        orderId: 'order1',
        ticketTypeId: 'tt1',
        editionId: 'edition1',
        attendeeEmail: 'john@example.com',
        attendeeFirstName: 'John',
        attendeeLastName: 'Doe',
        ticketNumber: 'TK-001',
        qrCode: 'qr-data'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'valid' })
      )
      expect(result.id).toBe('ticket1')
    })
  })

  describe('updateStatus', () => {
    it('should update the ticket status', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'cancelled' })
      const result = await getRepo().updateStatus('ticket1', 'cancelled')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('ticket1', { status: 'cancelled' })
      expect(result.status).toBe('cancelled')
    })
  })

  describe('checkIn', () => {
    it('should update status to used with check-in details', async () => {
      const checkedInRecord = {
        ...MOCK_RECORD,
        status: 'used',
        checkedInAt: '2024-06-15T10:00:00Z',
        checkedInBy: 'user1'
      }
      mockPb.mockCollection.update.mockResolvedValue(checkedInRecord)
      const result = await getRepo().checkIn('ticket1', 'user1')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('ticket1', {
        status: 'used',
        checkedInAt: expect.any(String),
        checkedInBy: 'user1'
      })
      expect(result.status).toBe('used')
      expect(result.checkedInAt).toBeInstanceOf(Date)
      expect(result.checkedInBy).toBe('user1')
    })
  })

  describe('countByEdition', () => {
    it('should count tickets by status', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        { status: 'valid' },
        { status: 'valid' },
        { status: 'used' },
        { status: 'cancelled' }
      ])
      const result = await getRepo().countByEdition('edition1')

      expect(result.total).toBe(4)
      expect(result.byStatus.valid).toBe(2)
      expect(result.byStatus.used).toBe(1)
      expect(result.byStatus.cancelled).toBe(1)
    })

    it('should return zero counts when no tickets', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().countByEdition('edition1')

      expect(result.total).toBe(0)
      expect(result.byStatus.valid).toBe(0)
      expect(result.byStatus.used).toBe(0)
      expect(result.byStatus.cancelled).toBe(0)
    })
  })

  describe('mapping', () => {
    it('should map checkedInAt when present', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        ...MOCK_RECORD,
        checkedInAt: '2024-06-15T10:00:00Z',
        checkedInBy: 'user1'
      })
      const result = await getRepo().findById('ticket1')

      expect(result?.checkedInAt).toBeInstanceOf(Date)
      expect(result?.checkedInBy).toBe('user1')
    })

    it('should default status to valid when empty', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({ ...MOCK_RECORD, status: '' })
      const result = await getRepo().findById('ticket1')

      expect(result?.status).toBe('valid')
    })
  })
})
