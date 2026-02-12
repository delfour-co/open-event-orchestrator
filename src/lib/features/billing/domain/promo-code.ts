/**
 * Promo Code Domain Entity
 *
 * Defines promotional codes for ticket discounts.
 */

import { z } from 'zod'

// Discount types
export const discountTypeSchema = z.enum(['percentage', 'fixed', 'free'])
export type DiscountType = z.infer<typeof discountTypeSchema>

// Promo code status
export const promoCodeStatusSchema = z.enum(['active', 'inactive', 'expired', 'exhausted'])
export type PromoCodeStatus = z.infer<typeof promoCodeStatusSchema>

// Promo code schema
export const promoCodeSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  code: z.string().min(3).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  discountType: discountTypeSchema,
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxUsageCount: z.number().int().min(0).optional(),
  maxUsagePerPerson: z.number().int().min(1).optional(),
  currentUsageCount: z.number().int().min(0).default(0),
  applicableTicketTypeIds: z.array(z.string()).optional(),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  created: z.date(),
  updated: z.date()
})
export type PromoCode = z.infer<typeof promoCodeSchema>

// Create promo code input
export type CreatePromoCode = Omit<PromoCode, 'id' | 'currentUsageCount' | 'created' | 'updated'>

// Update promo code input
export type UpdatePromoCode = Partial<
  Pick<
    PromoCode,
    | 'name'
    | 'description'
    | 'discountType'
    | 'discountValue'
    | 'minOrderAmount'
    | 'maxUsageCount'
    | 'maxUsagePerPerson'
    | 'applicableTicketTypeIds'
    | 'startsAt'
    | 'expiresAt'
    | 'isActive'
  >
>

// Promo code usage schema
export const promoCodeUsageSchema = z.object({
  id: z.string(),
  promoCodeId: z.string(),
  orderId: z.string(),
  email: z.string().email(),
  discountAmount: z.number().min(0),
  created: z.date()
})
export type PromoCodeUsage = z.infer<typeof promoCodeUsageSchema>

// Create usage input
export type CreatePromoCodeUsage = Omit<PromoCodeUsage, 'id' | 'created'>

// Validation result
export interface PromoCodeValidation {
  valid: boolean
  code?: PromoCode
  error?: string
  errorCode?: PromoCodeErrorCode
}

// Error codes
export type PromoCodeErrorCode =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'not_started'
  | 'exhausted'
  | 'max_per_person_reached'
  | 'min_order_not_met'
  | 'ticket_type_not_applicable'

// Discount calculation result
export interface DiscountCalculation {
  originalAmount: number
  discountAmount: number
  finalAmount: number
  appliedCode: string
}

// Bulk generation result
export interface BulkGenerationResult {
  codes: string[]
  count: number
  prefix: string
}

// Usage statistics
export interface PromoCodeStats {
  totalUsageCount: number
  totalDiscountAmount: number
  uniqueUsers: number
  averageDiscount: number
  usageByDate: { date: string; count: number }[]
}

// Labels
export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  free: 'Free'
}

export const PROMO_CODE_STATUS_LABELS: Record<PromoCodeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  exhausted: 'Exhausted'
}

export const PROMO_CODE_ERROR_MESSAGES: Record<PromoCodeErrorCode, string> = {
  not_found: 'Promo code not found',
  inactive: 'This promo code is no longer active',
  expired: 'This promo code has expired',
  not_started: 'This promo code is not yet valid',
  exhausted: 'This promo code has reached its usage limit',
  max_per_person_reached: 'You have already used this promo code',
  min_order_not_met: 'Minimum order amount not reached for this promo code',
  ticket_type_not_applicable: 'This promo code is not applicable to selected tickets'
}

/**
 * Get promo code status
 */
export function getPromoCodeStatus(code: PromoCode): PromoCodeStatus {
  if (!code.isActive) return 'inactive'

  const now = new Date()

  if (code.expiresAt && now > code.expiresAt) return 'expired'

  if (code.maxUsageCount && code.currentUsageCount >= code.maxUsageCount) return 'exhausted'

  return 'active'
}

/**
 * Check if promo code is valid for use
 */
export function isPromoCodeValid(code: PromoCode): boolean {
  return getPromoCodeStatus(code) === 'active'
}

/**
 * Validate promo code for an order
 */
export function validatePromoCode(
  code: PromoCode | null,
  orderAmount: number,
  _email: string,
  ticketTypeIds: string[],
  userUsageCount: number
): PromoCodeValidation {
  if (!code) {
    return { valid: false, error: PROMO_CODE_ERROR_MESSAGES.not_found, errorCode: 'not_found' }
  }

  if (!code.isActive) {
    return { valid: false, error: PROMO_CODE_ERROR_MESSAGES.inactive, errorCode: 'inactive' }
  }

  const now = new Date()

  if (code.startsAt && now < code.startsAt) {
    return { valid: false, error: PROMO_CODE_ERROR_MESSAGES.not_started, errorCode: 'not_started' }
  }

  if (code.expiresAt && now > code.expiresAt) {
    return { valid: false, error: PROMO_CODE_ERROR_MESSAGES.expired, errorCode: 'expired' }
  }

  if (code.maxUsageCount && code.currentUsageCount >= code.maxUsageCount) {
    return { valid: false, error: PROMO_CODE_ERROR_MESSAGES.exhausted, errorCode: 'exhausted' }
  }

  if (code.maxUsagePerPerson && userUsageCount >= code.maxUsagePerPerson) {
    return {
      valid: false,
      error: PROMO_CODE_ERROR_MESSAGES.max_per_person_reached,
      errorCode: 'max_per_person_reached'
    }
  }

  if (code.minOrderAmount && orderAmount < code.minOrderAmount) {
    return {
      valid: false,
      error: `${PROMO_CODE_ERROR_MESSAGES.min_order_not_met} (minimum: ${formatCurrency(code.minOrderAmount)})`,
      errorCode: 'min_order_not_met'
    }
  }

  // Check if applicable to ticket types
  if (code.applicableTicketTypeIds && code.applicableTicketTypeIds.length > 0) {
    const hasApplicableTicket = ticketTypeIds.some((id) =>
      code.applicableTicketTypeIds?.includes(id)
    )
    if (!hasApplicableTicket) {
      return {
        valid: false,
        error: PROMO_CODE_ERROR_MESSAGES.ticket_type_not_applicable,
        errorCode: 'ticket_type_not_applicable'
      }
    }
  }

  return { valid: true, code }
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  code: PromoCode,
  orderAmount: number,
  applicableAmount?: number
): number {
  const baseAmount = applicableAmount ?? orderAmount

  switch (code.discountType) {
    case 'percentage':
      return Math.round((baseAmount * code.discountValue) / 100)
    case 'fixed':
      return Math.min(code.discountValue, baseAmount)
    case 'free':
      return baseAmount
  }
}

/**
 * Calculate full discount for an order
 */
export function calculateOrderDiscount(
  code: PromoCode,
  orderAmount: number,
  _ticketTypeIds: string[],
  ticketAmounts: Record<string, number>
): DiscountCalculation {
  let applicableAmount = orderAmount

  // If code is restricted to certain ticket types, only apply to those
  if (code.applicableTicketTypeIds && code.applicableTicketTypeIds.length > 0) {
    applicableAmount = code.applicableTicketTypeIds.reduce((sum, typeId) => {
      return sum + (ticketAmounts[typeId] || 0)
    }, 0)
  }

  const discountAmount = calculateDiscount(code, orderAmount, applicableAmount)
  const finalAmount = Math.max(0, orderAmount - discountAmount)

  return {
    originalAmount: orderAmount,
    discountAmount,
    finalAmount,
    appliedCode: code.code
  }
}

/**
 * Generate a random promo code
 */
export function generatePromoCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate multiple unique promo codes with prefix
 */
export function generateBulkPromoCodes(
  count: number,
  prefix = '',
  length = 8
): BulkGenerationResult {
  const codes: string[] = []
  const usedCodes = new Set<string>()

  while (codes.length < count) {
    const code = prefix + generatePromoCode(length - prefix.length)
    if (!usedCodes.has(code)) {
      usedCodes.add(code)
      codes.push(code)
    }
  }

  return { codes, count, prefix }
}

/**
 * Normalize promo code for comparison
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Format discount for display
 */
export function formatDiscount(code: PromoCode): string {
  switch (code.discountType) {
    case 'percentage':
      return `-${code.discountValue}%`
    case 'fixed':
      return `-${formatCurrency(code.discountValue)}`
    case 'free':
      return 'FREE'
  }
}

/**
 * Format currency (helper)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount / 100)
}

/**
 * Check if promo code is applicable to a ticket type
 */
export function isApplicableToTicketType(code: PromoCode, ticketTypeId: string): boolean {
  if (!code.applicableTicketTypeIds || code.applicableTicketTypeIds.length === 0) {
    return true
  }
  return code.applicableTicketTypeIds.includes(ticketTypeId)
}

/**
 * Get remaining uses for a promo code
 */
export function getRemainingUses(code: PromoCode): number | null {
  if (!code.maxUsageCount) return null
  return Math.max(0, code.maxUsageCount - code.currentUsageCount)
}

/**
 * Check if promo code is within validity period
 */
export function isWithinValidityPeriod(code: PromoCode, date: Date = new Date()): boolean {
  if (code.startsAt && date < code.startsAt) return false
  if (code.expiresAt && date > code.expiresAt) return false
  return true
}

/**
 * Calculate usage statistics
 */
export function calculatePromoCodeStats(usages: PromoCodeUsage[]): PromoCodeStats {
  const totalUsageCount = usages.length
  const totalDiscountAmount = usages.reduce((sum, u) => sum + u.discountAmount, 0)
  const uniqueUsers = new Set(usages.map((u) => u.email)).size
  const averageDiscount = totalUsageCount > 0 ? totalDiscountAmount / totalUsageCount : 0

  // Group by date
  const usageByDateMap = new Map<string, number>()
  for (const usage of usages) {
    const date = usage.created.toISOString().split('T')[0]
    usageByDateMap.set(date, (usageByDateMap.get(date) || 0) + 1)
  }

  const usageByDate = Array.from(usageByDateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalUsageCount,
    totalDiscountAmount,
    uniqueUsers,
    averageDiscount,
    usageByDate
  }
}
