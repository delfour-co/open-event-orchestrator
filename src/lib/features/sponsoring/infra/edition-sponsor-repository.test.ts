import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEditionSponsorRepository } from './edition-sponsor-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://example.com/logo.png')
  }
  return {
    collection: mockCollection,
    files: mockFiles,
    _mockCollection: mockCollection
  }
}

const makeEditionSponsorRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'es1',
  editionId: 'ed1',
  sponsorId: 'sp1',
  packageId: 'pkg1',
  status: 'confirmed',
  confirmedAt: '2024-06-15T10:00:00Z',
  paidAt: '2024-06-16T10:00:00Z',
  amount: 5000,
  invoiceNumber: 'INV-001',
  stripePaymentIntentId: 'pi_123',
  paymentProvider: 'stripe',
  poNumber: 'PO-001',
  invoicePdf: 'invoice.pdf',
  notes: 'Great sponsor',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('EditionSponsorRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return an edition sponsor when found', async () => {
      const record = makeEditionSponsorRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('es1')

      expect(result?.id).toBe('es1')
      expect(result?.status).toBe('confirmed')
      expect(result?.amount).toBe(5000)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByIdWithExpand', () => {
    it('should return expanded edition sponsor with sponsor and package', async () => {
      const record = {
        ...makeEditionSponsorRecord(),
        expand: {
          sponsorId: {
            id: 'sp1',
            organizationId: 'org1',
            name: 'Acme Corp',
            created: '2024-06-15T10:00:00Z',
            updated: '2024-06-15T10:00:00Z'
          },
          packageId: {
            id: 'pkg1',
            editionId: 'ed1',
            name: 'Gold',
            tier: 1,
            price: 5000,
            currency: 'EUR',
            benefits: [],
            created: '2024-06-15T10:00:00Z',
            updated: '2024-06-15T10:00:00Z'
          }
        }
      }
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithExpand('es1')

      expect(result?.sponsor?.name).toBe('Acme Corp')
      expect(result?.package?.name).toBe('Gold')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithExpand('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return edition sponsors for an edition', async () => {
      const records = [makeEditionSponsorRecord(), makeEditionSponsorRecord({ id: 'es2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
    })
  })

  describe('findByStatus', () => {
    it('should filter by edition and status', async () => {
      const records = [makeEditionSponsorRecord({ status: 'negotiating' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByStatus('ed1', 'negotiating')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('negotiating')
    })
  })

  describe('findByEditionAndSponsor', () => {
    it('should return edition sponsor when found', async () => {
      const record = makeEditionSponsorRecord()
      const mockGetList = vi.fn().mockResolvedValue({ items: [record] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionAndSponsor('ed1', 'sp1')

      expect(result?.id).toBe('es1')
    })

    it('should return null when not found', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionAndSponsor('ed1', 'sp999')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create an edition sponsor', async () => {
      const record = makeEditionSponsorRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        sponsorId: 'sp1',
        packageId: 'pkg1',
        status: 'confirmed',
        confirmedAt: new Date(),
        amount: 5000
      })

      expect(result?.id).toBe('es1')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'ed1',
          sponsorId: 'sp1'
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeEditionSponsorRecord({ notes: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('es1', { notes: 'Updated' })

      expect(result?.notes).toBe('Updated')
    })

    it('should set nullable fields to null when empty', async () => {
      const record = makeEditionSponsorRecord({ notes: '' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      await repo.update('es1', { notes: '' })

      expect(mockUpdate).toHaveBeenCalledWith('es1', { notes: null })
    })
  })

  describe('updateStatus', () => {
    it('should set confirmedAt when status changes to confirmed', async () => {
      const record = makeEditionSponsorRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('es1', 'confirmed')

      expect(mockUpdate).toHaveBeenCalledWith(
        'es1',
        expect.objectContaining({
          status: 'confirmed',
          confirmedAt: expect.any(String)
        })
      )
    })

    it('should not set confirmedAt for non-confirmed status', async () => {
      const record = makeEditionSponsorRecord({ status: 'declined' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('es1', 'declined')

      expect(mockUpdate).toHaveBeenCalledWith('es1', { status: 'declined' })
    })
  })

  describe('delete', () => {
    it('should delete an edition sponsor', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      await repo.delete('es1')

      expect(mockDelete).toHaveBeenCalledWith('es1')
    })
  })

  describe('getStats', () => {
    it('should return aggregated sponsor statistics', async () => {
      const records = [
        { id: 'es1', status: 'confirmed', amount: 5000, paidAt: '2024-06-16T10:00:00Z' },
        { id: 'es2', status: 'confirmed', amount: 3000, paidAt: '' },
        { id: 'es3', status: 'prospect', amount: 0, paidAt: '' },
        { id: 'es4', status: 'declined', amount: 0, paidAt: '' }
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const stats = await repo.getStats('ed1')

      expect(stats.total).toBe(4)
      expect(stats.confirmed).toBe(2)
      expect(stats.totalAmount).toBe(8000)
      expect(stats.paidAmount).toBe(5000)
      expect(stats.byStatus.prospect).toBe(1)
      expect(stats.byStatus.declined).toBe(1)
    })

    it('should return zero stats when no sponsors', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createEditionSponsorRepository(mockPb as unknown as PocketBase)
      const stats = await repo.getStats('ed1')

      expect(stats.total).toBe(0)
      expect(stats.confirmed).toBe(0)
      expect(stats.totalAmount).toBe(0)
    })
  })
})
