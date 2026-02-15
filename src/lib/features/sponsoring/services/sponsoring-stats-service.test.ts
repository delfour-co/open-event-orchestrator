import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsoringStatsService } from './sponsoring-stats-service'

describe('sponsoring-stats-service', () => {
  let mockPb: PocketBase

  const mockPackages = [
    {
      id: 'pkg-1',
      name: 'Platinum',
      tier: 1,
      price: 10000,
      currency: 'EUR',
      maxSponsors: 2,
      benefits: [
        { name: 'Logo on website', included: true },
        { name: 'Booth', included: true },
        { name: 'Speaking slot', included: true }
      ]
    },
    {
      id: 'pkg-2',
      name: 'Gold',
      tier: 2,
      price: 5000,
      currency: 'EUR',
      maxSponsors: 5,
      benefits: [
        { name: 'Logo on website', included: true },
        { name: 'Booth', included: true }
      ]
    },
    {
      id: 'pkg-3',
      name: 'Silver',
      tier: 3,
      price: 2000,
      currency: 'EUR',
      maxSponsors: null,
      benefits: [{ name: 'Logo on website', included: true }]
    }
  ]

  const mockEditionSponsors = [
    {
      id: 'es-1',
      sponsorId: 'sponsor-1',
      packageId: 'pkg-1',
      status: 'confirmed',
      amount: 10000,
      paidAt: '2024-01-15',
      expand: {
        sponsorId: { id: 'sponsor-1', name: 'Acme Corp' },
        packageId: mockPackages[0]
      }
    },
    {
      id: 'es-2',
      sponsorId: 'sponsor-2',
      packageId: 'pkg-2',
      status: 'confirmed',
      amount: 5000,
      paidAt: null,
      expand: {
        sponsorId: { id: 'sponsor-2', name: 'TechCo' },
        packageId: mockPackages[1]
      }
    },
    {
      id: 'es-3',
      sponsorId: 'sponsor-3',
      packageId: 'pkg-2',
      status: 'negotiating',
      amount: null,
      paidAt: null,
      expand: {
        sponsorId: { id: 'sponsor-3', name: 'StartupXYZ' },
        packageId: mockPackages[1]
      }
    },
    {
      id: 'es-4',
      sponsorId: 'sponsor-4',
      packageId: null,
      status: 'prospect',
      amount: null,
      paidAt: null,
      expand: {
        sponsorId: { id: 'sponsor-4', name: 'NewCompany' }
      }
    },
    {
      id: 'es-5',
      sponsorId: 'sponsor-5',
      packageId: 'pkg-3',
      status: 'declined',
      amount: null,
      paidAt: null,
      expand: {
        sponsorId: { id: 'sponsor-5', name: 'OldCompany' },
        packageId: mockPackages[2]
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSponsorStats', () => {
    it('should return correct sponsor counts by status', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockEditionSponsors)
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const stats = await service.getSponsorStats('edition-1')

      expect(stats.total).toBe(5)
      expect(stats.byStatus.confirmed).toBe(2)
      expect(stats.byStatus.negotiating).toBe(1)
      expect(stats.byStatus.prospect).toBe(1)
      expect(stats.byStatus.declined).toBe(1)
      expect(stats.confirmed).toBe(2)
      expect(stats.active).toBe(4) // prospect + contacted + negotiating + confirmed
    })

    it('should count sponsors by package', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockEditionSponsors)
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const stats = await service.getSponsorStats('edition-1')

      expect(stats.byPackage).toHaveLength(3)

      const platinum = stats.byPackage.find((p) => p.packageId === 'pkg-1')
      expect(platinum?.count).toBe(1)
      expect(platinum?.availableSlots).toBe(1) // maxSponsors(2) - count(1)

      const gold = stats.byPackage.find((p) => p.packageId === 'pkg-2')
      expect(gold?.count).toBe(2)
      expect(gold?.availableSlots).toBe(3) // maxSponsors(5) - count(2)

      const silver = stats.byPackage.find((p) => p.packageId === 'pkg-3')
      expect(silver?.count).toBe(1)
      expect(silver?.availableSlots).toBeNull() // no maxSponsors
    })

    it('should handle empty sponsors', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const stats = await service.getSponsorStats('edition-1')

      expect(stats.total).toBe(0)
      expect(stats.confirmed).toBe(0)
      expect(stats.active).toBe(0)
    })
  })

  describe('getRevenueStats', () => {
    it('should calculate revenue correctly', async () => {
      const confirmedSponsors = mockEditionSponsors.filter((s) => s.status === 'confirmed')

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(confirmedSponsors)
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const revenue = await service.getRevenueStats('edition-1')

      expect(revenue.totalRevenue).toBe(15000) // 10000 + 5000
      expect(revenue.paidRevenue).toBe(10000) // Only es-1 has paidAt
      expect(revenue.pendingRevenue).toBe(5000) // 15000 - 10000
      expect(revenue.currency).toBe('EUR')
    })

    it('should calculate target revenue from packages', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue([])
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const revenue = await service.getRevenueStats('edition-1')

      // Target: Platinum (10000 * 2) + Gold (5000 * 5) = 20000 + 25000 = 45000
      // Silver has no maxSponsors, so it's not included
      expect(revenue.targetRevenue).toBe(45000)
    })

    it('should calculate progress percent', async () => {
      const confirmedSponsors = mockEditionSponsors.filter((s) => s.status === 'confirmed')

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(confirmedSponsors)
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const revenue = await service.getRevenueStats('edition-1')

      // 15000 / 45000 = 33.33%
      expect(revenue.progressPercent).toBeCloseTo(33.33, 1)
    })
  })

  describe('getPipelineStats', () => {
    it('should return pipeline statistics', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockEditionSponsors)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const pipeline = await service.getPipelineStats('edition-1')

      expect(pipeline.prospects).toBe(1)
      expect(pipeline.contacted).toBe(0)
      expect(pipeline.negotiating).toBe(1)
      expect(pipeline.confirmed).toBe(2)
      expect(pipeline.declined).toBe(1)
      expect(pipeline.cancelled).toBe(0)
    })

    it('should calculate conversion rate excluding cancelled', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockEditionSponsors)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const pipeline = await service.getPipelineStats('edition-1')

      // 2 confirmed / 5 total (no cancelled) = 40%
      expect(pipeline.conversionRate).toBe(40)
    })

    it('should calculate average deal size', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockEditionSponsors)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const pipeline = await service.getPipelineStats('edition-1')

      // (10000 + 5000) / 2 = 7500
      expect(pipeline.averageDealSize).toBe(7500)
    })
  })

  describe('getPendingDeliverables', () => {
    it('should return pending deliverables for confirmed sponsors', async () => {
      const confirmedSponsors = mockEditionSponsors.filter((s) => s.status === 'confirmed')

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(confirmedSponsors)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const deliverables = await service.getPendingDeliverables('edition-1')

      expect(deliverables).toHaveLength(2)

      const acme = deliverables.find((d) => d.sponsorId === 'sponsor-1')
      expect(acme?.pendingBenefits).toHaveLength(3)
      expect(acme?.pendingBenefits).toContain('Logo on website')
      expect(acme?.pendingBenefits).toContain('Booth')
      expect(acme?.pendingBenefits).toContain('Speaking slot')

      const techco = deliverables.find((d) => d.sponsorId === 'sponsor-2')
      expect(techco?.pendingBenefits).toHaveLength(2)
    })

    it('should handle sponsors without packages', async () => {
      const sponsorWithoutPackage = [
        {
          id: 'es-no-pkg',
          sponsorId: 'sponsor-x',
          packageId: null,
          status: 'confirmed',
          amount: 1000,
          expand: {
            sponsorId: { id: 'sponsor-x', name: 'No Package Sponsor' }
          }
        }
      ]

      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockResolvedValue(sponsorWithoutPackage)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const deliverables = await service.getPendingDeliverables('edition-1')

      expect(deliverables).toHaveLength(0)
    })
  })

  describe('getStats', () => {
    it('should return comprehensive sponsoring statistics', async () => {
      mockPb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'edition_sponsors') {
            return {
              getFullList: vi.fn().mockImplementation(({ filter }) => {
                if (filter && filter.includes('confirmed')) {
                  return Promise.resolve(
                    mockEditionSponsors.filter((s) => s.status === 'confirmed')
                  )
                }
                return Promise.resolve(mockEditionSponsors)
              })
            }
          }
          if (name === 'sponsor_packages') {
            return {
              getFullList: vi.fn().mockResolvedValue(mockPackages)
            }
          }
          return {}
        })
      } as unknown as PocketBase

      const service = createSponsoringStatsService(mockPb)
      const stats = await service.getStats('edition-1')

      expect(stats.sponsors.total).toBe(5)
      expect(stats.revenue.totalRevenue).toBe(15000)
      expect(stats.pipeline.confirmed).toBe(2)
      expect(stats.totalPackages).toBe(3)
      expect(stats.pendingDeliverables).toHaveLength(2)
    })
  })
})
