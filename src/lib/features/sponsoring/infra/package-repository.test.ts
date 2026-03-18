import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPackageRepository } from './package-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makePackageRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'pkg1',
  editionId: 'ed1',
  name: 'Gold',
  tier: 2,
  price: 5000,
  currency: 'EUR',
  maxSponsors: 10,
  benefits: [{ name: 'Logo on website', description: 'Your logo displayed' }],
  description: 'Gold sponsorship',
  isActive: true,
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('PackageRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return a package when found', async () => {
      const record = makePackageRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('pkg1')

      expect(result?.id).toBe('pkg1')
      expect(result?.name).toBe('Gold')
      expect(result?.price).toBe(5000)
      expect(mockGetOne).toHaveBeenCalledWith('pkg1')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })

    it('should parse string benefits as JSON', async () => {
      const record = makePackageRecord({
        benefits: JSON.stringify([{ name: 'Booth', description: 'A booth' }])
      })
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('pkg1')

      expect(result?.benefits).toHaveLength(1)
      expect(result?.benefits[0].name).toBe('Booth')
    })

    it('should handle invalid JSON benefits gracefully', async () => {
      const record = makePackageRecord({ benefits: 'not-json' })
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('pkg1')

      expect(result?.benefits).toEqual([])
    })
  })

  describe('findByEdition', () => {
    it('should return packages for an edition', async () => {
      const records = [makePackageRecord(), makePackageRecord({ id: 'pkg2', name: 'Silver' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'tier' }))
    })

    it('should return empty array when no packages exist', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toEqual([])
    })
  })

  describe('findActiveByEdition', () => {
    it('should return only active packages', async () => {
      const records = [makePackageRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findActiveByEdition('ed1')

      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a package with all fields', async () => {
      const record = makePackageRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        name: 'Gold',
        tier: 2,
        price: 5000,
        currency: 'EUR',
        benefits: [],
        maxSponsors: 10,
        description: 'Gold sponsorship',
        isActive: true
      })

      expect(result?.name).toBe('Gold')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'ed1',
          name: 'Gold',
          price: 5000
        })
      )
    })

    it('should default maxSponsors to null and isActive to true', async () => {
      const record = makePackageRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        name: 'Gold',
        tier: 2,
        price: 5000,
        currency: 'EUR',
        isActive: true,
        benefits: []
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSponsors: null,
          isActive: true
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makePackageRecord({ name: 'Platinum' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('pkg1', { name: 'Platinum' })

      expect(result?.name).toBe('Platinum')
      expect(mockUpdate).toHaveBeenCalledWith('pkg1', { name: 'Platinum' })
    })

    it('should not include undefined fields in update data', async () => {
      const record = makePackageRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      await repo.update('pkg1', { price: 3000 })

      expect(mockUpdate).toHaveBeenCalledWith('pkg1', { price: 3000 })
    })
  })

  describe('delete', () => {
    it('should delete a package', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      await repo.delete('pkg1')

      expect(mockDelete).toHaveBeenCalledWith('pkg1')
    })
  })

  describe('countSponsorsByPackage', () => {
    it('should return count of sponsors for a package', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 5 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.countSponsorsByPackage('pkg1')

      expect(result).toBe(5)
    })

    it('should return zero when no sponsors', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 0 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      const result = await repo.countSponsorsByPackage('pkg1')

      expect(result).toBe(0)
    })
  })

  describe('reorderTiers', () => {
    it('should update tier for each package in order', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createPackageRepository(mockPb as unknown as PocketBase)
      await repo.reorderTiers('ed1', ['pkg3', 'pkg1', 'pkg2'])

      expect(mockUpdate).toHaveBeenCalledTimes(3)
      expect(mockUpdate).toHaveBeenNthCalledWith(1, 'pkg3', { tier: 1 })
      expect(mockUpdate).toHaveBeenNthCalledWith(2, 'pkg1', { tier: 2 })
      expect(mockUpdate).toHaveBeenNthCalledWith(3, 'pkg2', { tier: 3 })
    })
  })
})
