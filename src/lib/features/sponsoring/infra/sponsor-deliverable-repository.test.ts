import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorDeliverableRepository } from './sponsor-deliverable-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeDeliverableRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'del1',
  editionSponsorId: 'es1',
  benefitName: 'Logo on website',
  description: 'Display logo on main page',
  status: 'pending',
  dueDate: '2024-07-01T00:00:00Z',
  deliveredAt: '',
  notes: 'Waiting for logo file',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SponsorDeliverableRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return a deliverable when found', async () => {
      const record = makeDeliverableRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('del1')

      expect(result?.id).toBe('del1')
      expect(result?.benefitName).toBe('Logo on website')
      expect(result?.status).toBe('pending')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByIdWithExpand', () => {
    it('should return expanded deliverable with sponsor and package', async () => {
      const record = {
        ...makeDeliverableRecord(),
        expand: {
          editionSponsorId: {
            id: 'es1',
            editionId: 'ed1',
            sponsorId: 'sp1',
            packageId: 'pkg1',
            status: 'confirmed',
            created: '2024-06-15T10:00:00Z',
            updated: '2024-06-15T10:00:00Z',
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
        }
      }
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithExpand('del1')

      expect(result?.id).toBe('del1')
      expect(result?.editionSponsor?.sponsor?.name).toBe('Acme Corp')
      expect(result?.editionSponsor?.package?.name).toBe('Gold')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithExpand('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByEditionSponsor', () => {
    it('should return deliverables for an edition sponsor', async () => {
      const records = [makeDeliverableRecord(), makeDeliverableRecord({ id: 'del2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsor('es1')

      expect(result).toHaveLength(2)
    })
  })

  describe('findByStatus', () => {
    it('should return deliverables filtered by status', async () => {
      const records = [makeDeliverableRecord({ status: 'in_progress' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByStatus('es1', 'in_progress')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('in_progress')
    })
  })

  describe('create', () => {
    it('should create a deliverable with all fields', async () => {
      const record = makeDeliverableRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionSponsorId: 'es1',
        benefitName: 'Logo on website',
        description: 'Display logo on main page',
        status: 'pending',
        dueDate: new Date('2024-07-01'),
        notes: 'Waiting for logo file'
      })

      expect(result?.benefitName).toBe('Logo on website')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionSponsorId: 'es1',
          benefitName: 'Logo on website'
        })
      )
    })
  })

  describe('createMany', () => {
    it('should create multiple deliverables', async () => {
      const record1 = makeDeliverableRecord({ id: 'del1' })
      const record2 = makeDeliverableRecord({ id: 'del2', benefitName: 'Booth' })
      const mockCreate = vi.fn().mockResolvedValueOnce(record1).mockResolvedValueOnce(record2)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.createMany([
        { editionSponsorId: 'es1', benefitName: 'Logo on website' },
        { editionSponsorId: 'es1', benefitName: 'Booth' }
      ])

      expect(result).toHaveLength(2)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeDeliverableRecord({ status: 'in_progress' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('del1', { status: 'in_progress' })

      expect(result?.status).toBe('in_progress')
    })
  })

  describe('updateStatus', () => {
    it('should update status and set deliveredAt when status is delivered', async () => {
      const record = makeDeliverableRecord({
        status: 'delivered',
        deliveredAt: '2024-07-01T12:00:00Z'
      })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('del1', 'delivered')

      expect(mockUpdate).toHaveBeenCalledWith(
        'del1',
        expect.objectContaining({
          status: 'delivered',
          deliveredAt: expect.any(String)
        })
      )
    })

    it('should not set deliveredAt for non-delivered status', async () => {
      const record = makeDeliverableRecord({ status: 'in_progress' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('del1', 'in_progress')

      expect(mockUpdate).toHaveBeenCalledWith('del1', { status: 'in_progress' })
    })
  })

  describe('delete', () => {
    it('should delete a deliverable', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      await repo.delete('del1')

      expect(mockDelete).toHaveBeenCalledWith('del1')
    })
  })

  describe('deleteByEditionSponsor', () => {
    it('should delete all deliverables for an edition sponsor', async () => {
      const records = [makeDeliverableRecord({ id: 'del1' }), makeDeliverableRecord({ id: 'del2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete
      })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      await repo.deleteByEditionSponsor('es1')

      expect(mockDelete).toHaveBeenCalledTimes(2)
    })
  })

  describe('countByEditionSponsor', () => {
    it('should count deliverables by status', async () => {
      const records = [
        { id: 'del1', status: 'pending' },
        { id: 'del2', status: 'pending' },
        { id: 'del3', status: 'in_progress' },
        { id: 'del4', status: 'delivered' }
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorDeliverableRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEditionSponsor('es1')

      expect(result.pending).toBe(2)
      expect(result.in_progress).toBe(1)
      expect(result.delivered).toBe(1)
    })
  })
})
