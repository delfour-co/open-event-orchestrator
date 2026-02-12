import { describe, expect, it } from 'vitest'
import {
  type PromoCode,
  type PromoCodeUsage,
  calculateDiscount,
  calculateOrderDiscount,
  calculatePromoCodeStats,
  formatDiscount,
  generateBulkPromoCodes,
  generatePromoCode,
  getPromoCodeStatus,
  getRemainingUses,
  isApplicableToTicketType,
  isPromoCodeValid,
  isWithinValidityPeriod,
  normalizePromoCode,
  validatePromoCode
} from './promo-code'

describe('promo-code', () => {
  const basePromoCode: PromoCode = {
    id: 'promo-1',
    editionId: 'edition-1',
    code: 'SAVE20',
    name: '20% Off',
    discountType: 'percentage',
    discountValue: 20,
    currentUsageCount: 0,
    isActive: true,
    createdBy: 'user-1',
    created: new Date(),
    updated: new Date()
  }

  describe('getPromoCodeStatus', () => {
    it('should return active for valid code', () => {
      expect(getPromoCodeStatus(basePromoCode)).toBe('active')
    })

    it('should return inactive when isActive is false', () => {
      const code = { ...basePromoCode, isActive: false }
      expect(getPromoCodeStatus(code)).toBe('inactive')
    })

    it('should return expired when past expiration date', () => {
      const code = { ...basePromoCode, expiresAt: new Date('2020-01-01') }
      expect(getPromoCodeStatus(code)).toBe('expired')
    })

    it('should return exhausted when usage limit reached', () => {
      const code = { ...basePromoCode, maxUsageCount: 10, currentUsageCount: 10 }
      expect(getPromoCodeStatus(code)).toBe('exhausted')
    })

    it('should return active when under usage limit', () => {
      const code = { ...basePromoCode, maxUsageCount: 10, currentUsageCount: 5 }
      expect(getPromoCodeStatus(code)).toBe('active')
    })
  })

  describe('isPromoCodeValid', () => {
    it('should return true for active code', () => {
      expect(isPromoCodeValid(basePromoCode)).toBe(true)
    })

    it('should return false for inactive code', () => {
      const code = { ...basePromoCode, isActive: false }
      expect(isPromoCodeValid(code)).toBe(false)
    })
  })

  describe('validatePromoCode', () => {
    it('should return valid for correct usage', () => {
      const result = validatePromoCode(basePromoCode, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(true)
      expect(result.code).toBe(basePromoCode)
    })

    it('should return not_found when code is null', () => {
      const result = validatePromoCode(null, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('not_found')
    })

    it('should return inactive when code is not active', () => {
      const code = { ...basePromoCode, isActive: false }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('inactive')
    })

    it('should return not_started when before start date', () => {
      const code = { ...basePromoCode, startsAt: new Date('2030-01-01') }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('not_started')
    })

    it('should return expired when after expiration date', () => {
      const code = { ...basePromoCode, expiresAt: new Date('2020-01-01') }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('expired')
    })

    it('should return exhausted when usage limit reached', () => {
      const code = { ...basePromoCode, maxUsageCount: 10, currentUsageCount: 10 }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('exhausted')
    })

    it('should return max_per_person_reached when user limit exceeded', () => {
      const code = { ...basePromoCode, maxUsagePerPerson: 1 }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 1)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('max_per_person_reached')
    })

    it('should return min_order_not_met when order too small', () => {
      const code = { ...basePromoCode, minOrderAmount: 5000 }
      const result = validatePromoCode(code, 3000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('min_order_not_met')
    })

    it('should return ticket_type_not_applicable when ticket not in list', () => {
      const code = { ...basePromoCode, applicableTicketTypeIds: ['ticket-2', 'ticket-3'] }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('ticket_type_not_applicable')
    })

    it('should be valid when ticket is in applicable list', () => {
      const code = { ...basePromoCode, applicableTicketTypeIds: ['ticket-1', 'ticket-2'] }
      const result = validatePromoCode(code, 10000, 'user@test.com', ['ticket-1'], 0)

      expect(result.valid).toBe(true)
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate percentage discount', () => {
      const code = { ...basePromoCode, discountType: 'percentage' as const, discountValue: 20 }
      expect(calculateDiscount(code, 10000)).toBe(2000)
    })

    it('should calculate fixed discount', () => {
      const code = { ...basePromoCode, discountType: 'fixed' as const, discountValue: 1500 }
      expect(calculateDiscount(code, 10000)).toBe(1500)
    })

    it('should cap fixed discount to order amount', () => {
      const code = { ...basePromoCode, discountType: 'fixed' as const, discountValue: 15000 }
      expect(calculateDiscount(code, 10000)).toBe(10000)
    })

    it('should calculate free discount', () => {
      const code = { ...basePromoCode, discountType: 'free' as const, discountValue: 0 }
      expect(calculateDiscount(code, 10000)).toBe(10000)
    })

    it('should use applicable amount when provided', () => {
      const code = { ...basePromoCode, discountType: 'percentage' as const, discountValue: 20 }
      expect(calculateDiscount(code, 10000, 5000)).toBe(1000)
    })
  })

  describe('calculateOrderDiscount', () => {
    it('should calculate full order discount', () => {
      const code = { ...basePromoCode, discountType: 'percentage' as const, discountValue: 20 }
      const result = calculateOrderDiscount(code, 10000, ['ticket-1'], { 'ticket-1': 10000 })

      expect(result.originalAmount).toBe(10000)
      expect(result.discountAmount).toBe(2000)
      expect(result.finalAmount).toBe(8000)
      expect(result.appliedCode).toBe('SAVE20')
    })

    it('should only discount applicable ticket types', () => {
      const code = {
        ...basePromoCode,
        discountType: 'percentage' as const,
        discountValue: 50,
        applicableTicketTypeIds: ['ticket-1']
      }
      const result = calculateOrderDiscount(code, 15000, ['ticket-1', 'ticket-2'], {
        'ticket-1': 5000,
        'ticket-2': 10000
      })

      expect(result.discountAmount).toBe(2500) // 50% of 5000
      expect(result.finalAmount).toBe(12500)
    })

    it('should not go below zero', () => {
      const code = { ...basePromoCode, discountType: 'fixed' as const, discountValue: 20000 }
      const result = calculateOrderDiscount(code, 10000, ['ticket-1'], { 'ticket-1': 10000 })

      expect(result.finalAmount).toBe(0)
    })
  })

  describe('generatePromoCode', () => {
    it('should generate code of specified length', () => {
      const code = generatePromoCode(10)
      expect(code).toHaveLength(10)
    })

    it('should generate alphanumeric code', () => {
      const code = generatePromoCode(8)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })

    it('should not contain ambiguous characters', () => {
      // Generate many codes to increase chance of catching issues
      for (let i = 0; i < 100; i++) {
        const code = generatePromoCode(8)
        expect(code).not.toMatch(/[OI01]/)
      }
    })
  })

  describe('generateBulkPromoCodes', () => {
    it('should generate specified count of codes', () => {
      const result = generateBulkPromoCodes(10)
      expect(result.codes).toHaveLength(10)
      expect(result.count).toBe(10)
    })

    it('should generate unique codes', () => {
      const result = generateBulkPromoCodes(100)
      const uniqueCodes = new Set(result.codes)
      expect(uniqueCodes.size).toBe(100)
    })

    it('should apply prefix to codes', () => {
      const result = generateBulkPromoCodes(5, 'VIP')
      expect(result.prefix).toBe('VIP')
      for (const code of result.codes) {
        expect(code.startsWith('VIP')).toBe(true)
      }
    })
  })

  describe('normalizePromoCode', () => {
    it('should convert to uppercase', () => {
      expect(normalizePromoCode('save20')).toBe('SAVE20')
    })

    it('should trim whitespace', () => {
      expect(normalizePromoCode('  SAVE20  ')).toBe('SAVE20')
    })

    it('should remove internal spaces', () => {
      expect(normalizePromoCode('SAVE 20')).toBe('SAVE20')
    })
  })

  describe('formatDiscount', () => {
    it('should format percentage discount', () => {
      const code = { ...basePromoCode, discountType: 'percentage' as const, discountValue: 20 }
      expect(formatDiscount(code)).toBe('-20%')
    })

    it('should format fixed discount', () => {
      const code = { ...basePromoCode, discountType: 'fixed' as const, discountValue: 1000 }
      expect(formatDiscount(code)).toBe('-€10.00')
    })

    it('should format free discount', () => {
      const code = { ...basePromoCode, discountType: 'free' as const }
      expect(formatDiscount(code)).toBe('FREE')
    })
  })

  describe('isApplicableToTicketType', () => {
    it('should return true when no restrictions', () => {
      expect(isApplicableToTicketType(basePromoCode, 'any-ticket')).toBe(true)
    })

    it('should return true when ticket in list', () => {
      const code = { ...basePromoCode, applicableTicketTypeIds: ['ticket-1', 'ticket-2'] }
      expect(isApplicableToTicketType(code, 'ticket-1')).toBe(true)
    })

    it('should return false when ticket not in list', () => {
      const code = { ...basePromoCode, applicableTicketTypeIds: ['ticket-1', 'ticket-2'] }
      expect(isApplicableToTicketType(code, 'ticket-3')).toBe(false)
    })
  })

  describe('getRemainingUses', () => {
    it('should return null when no limit', () => {
      expect(getRemainingUses(basePromoCode)).toBeNull()
    })

    it('should return remaining uses', () => {
      const code = { ...basePromoCode, maxUsageCount: 100, currentUsageCount: 30 }
      expect(getRemainingUses(code)).toBe(70)
    })

    it('should return 0 when exhausted', () => {
      const code = { ...basePromoCode, maxUsageCount: 100, currentUsageCount: 100 }
      expect(getRemainingUses(code)).toBe(0)
    })
  })

  describe('isWithinValidityPeriod', () => {
    it('should return true when no dates set', () => {
      expect(isWithinValidityPeriod(basePromoCode)).toBe(true)
    })

    it('should return true when within period', () => {
      const code = {
        ...basePromoCode,
        startsAt: new Date('2020-01-01'),
        expiresAt: new Date('2030-12-31')
      }
      expect(isWithinValidityPeriod(code)).toBe(true)
    })

    it('should return false when before start', () => {
      const code = { ...basePromoCode, startsAt: new Date('2030-01-01') }
      expect(isWithinValidityPeriod(code)).toBe(false)
    })

    it('should return false when after expiration', () => {
      const code = { ...basePromoCode, expiresAt: new Date('2020-01-01') }
      expect(isWithinValidityPeriod(code)).toBe(false)
    })
  })

  describe('calculatePromoCodeStats', () => {
    it('should calculate stats for usages', () => {
      const usages: PromoCodeUsage[] = [
        {
          id: 'u1',
          promoCodeId: 'promo-1',
          orderId: 'o1',
          email: 'a@test.com',
          discountAmount: 1000,
          created: new Date('2024-01-15')
        },
        {
          id: 'u2',
          promoCodeId: 'promo-1',
          orderId: 'o2',
          email: 'b@test.com',
          discountAmount: 2000,
          created: new Date('2024-01-15')
        },
        {
          id: 'u3',
          promoCodeId: 'promo-1',
          orderId: 'o3',
          email: 'a@test.com',
          discountAmount: 1500,
          created: new Date('2024-01-16')
        }
      ]

      const stats = calculatePromoCodeStats(usages)

      expect(stats.totalUsageCount).toBe(3)
      expect(stats.totalDiscountAmount).toBe(4500)
      expect(stats.uniqueUsers).toBe(2)
      expect(stats.averageDiscount).toBe(1500)
      expect(stats.usageByDate).toHaveLength(2)
    })

    it('should handle empty usages', () => {
      const stats = calculatePromoCodeStats([])

      expect(stats.totalUsageCount).toBe(0)
      expect(stats.totalDiscountAmount).toBe(0)
      expect(stats.uniqueUsers).toBe(0)
      expect(stats.averageDiscount).toBe(0)
      expect(stats.usageByDate).toHaveLength(0)
    })
  })
})
