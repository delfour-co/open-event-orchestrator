import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPromoCodeService } from './promo-code-service'

describe('promo-code-service', () => {
  let mockPb: PocketBase

  const mockPromoCodeRecord = {
    id: 'promo-1',
    editionId: 'edition-1',
    code: 'SAVE20',
    name: '20% Off',
    description: 'Save 20% on your order',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: null,
    maxUsageCount: 100,
    maxUsagePerPerson: 1,
    currentUsageCount: 5,
    applicableTicketTypeIds: null,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdBy: 'user-1',
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-15T10:00:00Z'
  }

  const mockUsageRecord = {
    id: 'usage-1',
    promoCodeId: 'promo-1',
    orderId: 'order-1',
    email: 'user@test.com',
    discountAmount: 2000,
    created: '2024-01-16T10:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockPb = {
      collection: vi.fn().mockReturnThis(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getOne: vi.fn(),
      getFirstListItem: vi.fn(),
      getFullList: vi.fn(),
      getList: vi.fn()
    } as unknown as PocketBase
  })

  describe('create', () => {
    it('should create a promo code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        create: vi.fn().mockResolvedValue(mockPromoCodeRecord)
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.create({
        editionId: 'edition-1',
        code: 'save20',
        name: '20% Off',
        discountType: 'percentage',
        discountValue: 20,
        isActive: true,
        createdBy: 'user-1'
      })

      expect(result.code).toBe('SAVE20')
      expect(result.discountType).toBe('percentage')
      expect(result.discountValue).toBe(20)
    })
  })

  describe('update', () => {
    it('should update a promo code', async () => {
      const updatedRecord = { ...mockPromoCodeRecord, name: 'Updated Name' }
      vi.mocked(mockPb.collection).mockReturnValue({
        update: vi.fn().mockResolvedValue(updatedRecord)
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.update('promo-1', { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
    })
  })

  describe('getById', () => {
    it('should return promo code by ID', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockPromoCodeRecord)
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getById('promo-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('promo-1')
    })

    it('should return null when not found', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getById('invalid')

      expect(result).toBeNull()
    })
  })

  describe('getByCode', () => {
    it('should return promo code by code string', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFirstListItem: vi.fn().mockResolvedValue(mockPromoCodeRecord)
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getByCode('edition-1', 'save20')

      expect(result).not.toBeNull()
      expect(result?.code).toBe('SAVE20')
    })

    it('should normalize code before searching', async () => {
      const mockGetFirstListItem = vi.fn().mockResolvedValue(mockPromoCodeRecord)
      vi.mocked(mockPb.collection).mockReturnValue({
        getFirstListItem: mockGetFirstListItem
      } as never)

      const service = createPromoCodeService(mockPb)
      await service.getByCode('edition-1', '  save 20  ')

      expect(mockGetFirstListItem).toHaveBeenCalledWith(expect.stringContaining('SAVE20'))
    })
  })

  describe('listByEdition', () => {
    it('should list all promo codes for edition', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([mockPromoCodeRecord])
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.listByEdition('edition-1')

      expect(result).toHaveLength(1)
      expect(result[0].editionId).toBe('edition-1')
    })

    it('should filter active only when requested', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([mockPromoCodeRecord])
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: mockGetFullList
      } as never)

      const service = createPromoCodeService(mockPb)
      await service.listByEdition('edition-1', { activeOnly: true })

      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('isActive = true')
        })
      )
    })
  })

  describe('validate', () => {
    it('should validate a valid promo code', async () => {
      vi.mocked(mockPb.collection).mockImplementation((name) => {
        if (name === 'promo_codes') {
          return {
            getFirstListItem: vi.fn().mockResolvedValue(mockPromoCodeRecord)
          } as never
        }
        if (name === 'promo_code_usages') {
          return {
            getList: vi.fn().mockResolvedValue({ totalItems: 0 })
          } as never
        }
        return {} as never
      })

      const service = createPromoCodeService(mockPb)
      const result = await service.validate('edition-1', 'SAVE20', 10000, 'user@test.com', [
        'ticket-1'
      ])

      expect(result.valid).toBe(true)
      expect(result.code?.code).toBe('SAVE20')
    })

    it('should return not_found for invalid code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.validate('edition-1', 'INVALID', 10000, 'user@test.com', [
        'ticket-1'
      ])

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('not_found')
    })
  })

  describe('applyToOrder', () => {
    it('should calculate discount for valid code', async () => {
      vi.mocked(mockPb.collection).mockImplementation((name) => {
        if (name === 'promo_codes') {
          return {
            getFirstListItem: vi.fn().mockResolvedValue(mockPromoCodeRecord)
          } as never
        }
        if (name === 'promo_code_usages') {
          return {
            getList: vi.fn().mockResolvedValue({ totalItems: 0 })
          } as never
        }
        return {} as never
      })

      const service = createPromoCodeService(mockPb)
      const result = await service.applyToOrder(
        'edition-1',
        'SAVE20',
        10000,
        'user@test.com',
        ['ticket-1'],
        { 'ticket-1': 10000 }
      )

      expect(result.success).toBe(true)
      expect(result.discount?.discountAmount).toBe(2000)
      expect(result.discount?.finalAmount).toBe(8000)
    })

    it('should return error for invalid code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.applyToOrder(
        'edition-1',
        'INVALID',
        10000,
        'user@test.com',
        ['ticket-1'],
        { 'ticket-1': 10000 }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('recordUsage', () => {
    it('should create usage record and increment count', async () => {
      const mockCreate = vi.fn().mockResolvedValue(mockUsageRecord)
      const mockGetOne = vi.fn().mockResolvedValue({ currentUsageCount: 5 })
      const mockUpdate = vi.fn().mockResolvedValue({})

      vi.mocked(mockPb.collection).mockImplementation((name) => {
        if (name === 'promo_code_usages') {
          return { create: mockCreate } as never
        }
        if (name === 'promo_codes') {
          return { getOne: mockGetOne, update: mockUpdate } as never
        }
        return {} as never
      })

      const service = createPromoCodeService(mockPb)
      const result = await service.recordUsage('promo-1', 'order-1', 'user@test.com', 2000)

      expect(result.promoCodeId).toBe('promo-1')
      expect(result.discountAmount).toBe(2000)
      expect(mockUpdate).toHaveBeenCalledWith('promo-1', { currentUsageCount: 6 })
    })
  })

  describe('getUserUsageCount', () => {
    it('should return user usage count', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ totalItems: 3 })
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getUserUsageCount('promo-1', 'user@test.com')

      expect(result).toBe(3)
    })
  })

  describe('getUsageHistory', () => {
    it('should return usage history for a code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([mockUsageRecord])
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getUsageHistory('promo-1')

      expect(result).toHaveLength(1)
      expect(result[0].promoCodeId).toBe('promo-1')
    })
  })

  describe('getStats', () => {
    it('should calculate statistics for a code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([
          { ...mockUsageRecord, email: 'a@test.com', discountAmount: 1000 },
          { ...mockUsageRecord, email: 'b@test.com', discountAmount: 2000 },
          { ...mockUsageRecord, email: 'a@test.com', discountAmount: 1500 }
        ])
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.getStats('promo-1')

      expect(result.totalUsageCount).toBe(3)
      expect(result.totalDiscountAmount).toBe(4500)
      expect(result.uniqueUsers).toBe(2)
    })
  })

  describe('bulkCreate', () => {
    it('should create multiple codes with prefix', async () => {
      let callCount = 0
      vi.mocked(mockPb.collection).mockReturnValue({
        create: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            ...mockPromoCodeRecord,
            id: `promo-${callCount}`,
            code: `VIP${callCount}ABC`
          })
        })
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.bulkCreate('edition-1', 3, 'VIP', {
        name: 'VIP Code',
        discountType: 'percentage',
        discountValue: 50,
        isActive: true,
        createdBy: 'user-1'
      })

      expect(result.success).toBe(true)
      expect(result.codes).toHaveLength(3)
      expect(result.count).toBe(3)
    })
  })

  describe('deactivate', () => {
    it('should deactivate a promo code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        update: vi.fn().mockResolvedValue({ ...mockPromoCodeRecord, isActive: false })
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.deactivate('promo-1')

      expect(result.isActive).toBe(false)
    })
  })

  describe('activate', () => {
    it('should activate a promo code', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        update: vi.fn().mockResolvedValue({ ...mockPromoCodeRecord, isActive: true })
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.activate('promo-1')

      expect(result.isActive).toBe(true)
    })
  })

  describe('exportWithUsage', () => {
    it('should export codes with usage stats', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getFullList: vi
          .fn()
          .mockResolvedValueOnce([mockPromoCodeRecord])
          .mockResolvedValueOnce([mockUsageRecord])
      } as never)

      const service = createPromoCodeService(mockPb)
      const result = await service.exportWithUsage('edition-1')

      expect(result).toHaveLength(1)
      expect(result[0].code.code).toBe('SAVE20')
      expect(result[0].stats.totalUsageCount).toBe(1)
    })
  })
})
