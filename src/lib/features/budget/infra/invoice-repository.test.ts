import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInvoiceRepository } from './invoice-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterIn: (field: string, values: string[]) => values.map((v) => `${field} = "${v}"`).join(' || ')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection,
    files: {
      getURL: vi.fn().mockReturnValue('https://example.com/file.pdf')
    }
  }
}

const makeInvoiceRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv1',
  transactionId: 'tx1',
  invoiceNumber: 'INV-001',
  file: 'invoice.pdf',
  issueDate: '2024-03-01T00:00:00Z',
  dueDate: '2024-04-01T00:00:00Z',
  amount: 5000,
  notes: 'Test invoice',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('InvoiceRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByTransaction', () => {
    it('should return invoices for a transaction', async () => {
      const records = [makeInvoiceRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByTransaction('tx1')

      expect(result).toHaveLength(1)
      expect(result[0].invoiceNumber).toBe('INV-001')
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: '-issueDate' }))
    })
  })

  describe('findByEdition', () => {
    it('should return invoices for given transaction ids', async () => {
      const records = [makeInvoiceRecord(), makeInvoiceRecord({ id: 'inv2', transactionId: 'tx2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition(['tx1', 'tx2'])

      expect(result).toHaveLength(2)
    })

    it('should return empty array for empty transaction ids', async () => {
      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition([])

      expect(result).toHaveLength(0)
    })
  })

  describe('findAll', () => {
    it('should return all invoices', async () => {
      const records = [makeInvoiceRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAll()

      expect(result).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('should return invoice by id', async () => {
      const record = makeInvoiceRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('inv1')

      expect(result?.id).toBe('inv1')
      expect(result?.amount).toBe(5000)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create an invoice from FormData', async () => {
      const record = makeInvoiceRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const formData = new FormData()
      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const result = await repo.create(formData)

      expect(result.invoiceNumber).toBe('INV-001')
      expect(mockCreate).toHaveBeenCalledWith(formData)
    })
  })

  describe('delete', () => {
    it('should delete an invoice by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      await repo.delete('inv1')

      expect(mockDelete).toHaveBeenCalledWith('inv1')
    })
  })

  describe('getFileUrl', () => {
    it('should return file URL when file exists', () => {
      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const url = repo.getFileUrl({
        id: 'inv1',
        transactionId: 'tx1',
        invoiceNumber: 'INV-001',
        file: 'invoice.pdf',
        issueDate: new Date(),
        amount: 5000,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(url).toBe('https://example.com/file.pdf')
    })

    it('should return null when no file', () => {
      const repo = createInvoiceRepository(mockPb as unknown as PocketBase)
      const url = repo.getFileUrl({
        id: 'inv1',
        transactionId: 'tx1',
        invoiceNumber: 'INV-001',
        file: undefined,
        issueDate: new Date(),
        amount: 5000,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(url).toBeNull()
    })
  })
})
