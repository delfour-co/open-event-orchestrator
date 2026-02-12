/**
 * Promo Code Service
 *
 * Handles promo code management, validation, and application.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CreatePromoCode,
  type DiscountCalculation,
  type PromoCode,
  type PromoCodeStats,
  type PromoCodeUsage,
  type PromoCodeValidation,
  type UpdatePromoCode,
  calculateOrderDiscount,
  calculatePromoCodeStats,
  generateBulkPromoCodes,
  normalizePromoCode,
  validatePromoCode
} from '../domain/promo-code'

export interface ApplyPromoCodeResult {
  success: boolean
  discount?: DiscountCalculation
  error?: string
}

export interface BulkCreateResult {
  success: boolean
  codes: PromoCode[]
  count: number
  error?: string
}

export const createPromoCodeService = (pb: PocketBase) => {
  /**
   * Create a new promo code
   */
  async function create(input: CreatePromoCode): Promise<PromoCode> {
    const data = {
      editionId: input.editionId,
      code: normalizePromoCode(input.code),
      name: input.name,
      description: input.description || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount || null,
      maxUsageCount: input.maxUsageCount || null,
      maxUsagePerPerson: input.maxUsagePerPerson || null,
      currentUsageCount: 0,
      applicableTicketTypeIds: input.applicableTicketTypeIds || null,
      startsAt: input.startsAt?.toISOString() || null,
      expiresAt: input.expiresAt?.toISOString() || null,
      isActive: input.isActive ?? true,
      createdBy: input.createdBy
    }

    const record = await pb.collection('promo_codes').create(data)
    return mapRecordToPromoCode(record)
  }

  /**
   * Update a promo code
   */
  async function update(id: string, input: UpdatePromoCode): Promise<PromoCode> {
    const data: Record<string, unknown> = {}

    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description || null
    if (input.discountType !== undefined) data.discountType = input.discountType
    if (input.discountValue !== undefined) data.discountValue = input.discountValue
    if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount || null
    if (input.maxUsageCount !== undefined) data.maxUsageCount = input.maxUsageCount || null
    if (input.maxUsagePerPerson !== undefined)
      data.maxUsagePerPerson = input.maxUsagePerPerson || null
    if (input.applicableTicketTypeIds !== undefined)
      data.applicableTicketTypeIds = input.applicableTicketTypeIds || null
    if (input.startsAt !== undefined) data.startsAt = input.startsAt?.toISOString() || null
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt?.toISOString() || null
    if (input.isActive !== undefined) data.isActive = input.isActive

    const record = await pb.collection('promo_codes').update(id, data)
    return mapRecordToPromoCode(record)
  }

  /**
   * Delete a promo code
   */
  async function remove(id: string): Promise<void> {
    await pb.collection('promo_codes').delete(id)
  }

  /**
   * Get a promo code by ID
   */
  async function getById(id: string): Promise<PromoCode | null> {
    try {
      const record = await pb.collection('promo_codes').getOne(id)
      return mapRecordToPromoCode(record)
    } catch {
      return null
    }
  }

  /**
   * Get a promo code by code string
   */
  async function getByCode(editionId: string, code: string): Promise<PromoCode | null> {
    const normalizedCode = normalizePromoCode(code)
    try {
      const record = await pb
        .collection('promo_codes')
        .getFirstListItem(safeFilter`editionId = ${editionId} && code = ${normalizedCode}`)
      return mapRecordToPromoCode(record)
    } catch {
      return null
    }
  }

  /**
   * List promo codes for an edition
   */
  async function listByEdition(
    editionId: string,
    options?: { activeOnly?: boolean }
  ): Promise<PromoCode[]> {
    let filter = safeFilter`editionId = ${editionId}`
    if (options?.activeOnly) {
      filter += ' && isActive = true'
    }

    const records = await pb.collection('promo_codes').getFullList({
      filter,
      sort: '-created'
    })

    return records.map(mapRecordToPromoCode)
  }

  /**
   * Validate a promo code for an order
   */
  async function validate(
    editionId: string,
    code: string,
    orderAmount: number,
    email: string,
    ticketTypeIds: string[]
  ): Promise<PromoCodeValidation> {
    const promoCode = await getByCode(editionId, code)

    if (!promoCode) {
      return { valid: false, error: 'Promo code not found', errorCode: 'not_found' }
    }

    // Get user's usage count
    const userUsageCount = await getUserUsageCount(promoCode.id, email)

    return validatePromoCode(promoCode, orderAmount, email, ticketTypeIds, userUsageCount)
  }

  /**
   * Apply a promo code to an order
   */
  async function applyToOrder(
    editionId: string,
    code: string,
    orderAmount: number,
    email: string,
    ticketTypeIds: string[],
    ticketAmounts: Record<string, number>
  ): Promise<ApplyPromoCodeResult> {
    const validation = await validate(editionId, code, orderAmount, email, ticketTypeIds)

    if (!validation.valid || !validation.code) {
      return { success: false, error: validation.error }
    }

    const discount = calculateOrderDiscount(
      validation.code,
      orderAmount,
      ticketTypeIds,
      ticketAmounts
    )

    return { success: true, discount }
  }

  /**
   * Record promo code usage
   */
  async function recordUsage(
    promoCodeId: string,
    orderId: string,
    email: string,
    discountAmount: number
  ): Promise<PromoCodeUsage> {
    // Create usage record
    const usageRecord = await pb.collection('promo_code_usages').create({
      promoCodeId,
      orderId,
      email,
      discountAmount
    })

    // Increment usage count
    const promoCode = await pb.collection('promo_codes').getOne(promoCodeId)
    await pb.collection('promo_codes').update(promoCodeId, {
      currentUsageCount: (promoCode.currentUsageCount || 0) + 1
    })

    return mapRecordToPromoCodeUsage(usageRecord)
  }

  /**
   * Get user's usage count for a promo code
   */
  async function getUserUsageCount(promoCodeId: string, email: string): Promise<number> {
    const result = await pb.collection('promo_code_usages').getList(1, 1, {
      filter: safeFilter`promoCodeId = ${promoCodeId} && email = ${email}`
    })
    return result.totalItems
  }

  /**
   * Get usage history for a promo code
   */
  async function getUsageHistory(promoCodeId: string): Promise<PromoCodeUsage[]> {
    const records = await pb.collection('promo_code_usages').getFullList({
      filter: safeFilter`promoCodeId = ${promoCodeId}`,
      sort: '-created'
    })

    return records.map(mapRecordToPromoCodeUsage)
  }

  /**
   * Get statistics for a promo code
   */
  async function getStats(promoCodeId: string): Promise<PromoCodeStats> {
    const usages = await getUsageHistory(promoCodeId)
    return calculatePromoCodeStats(usages)
  }

  /**
   * Bulk create promo codes
   */
  async function bulkCreate(
    editionId: string,
    count: number,
    prefix: string,
    baseInput: Omit<CreatePromoCode, 'code' | 'editionId'>
  ): Promise<BulkCreateResult> {
    const { codes } = generateBulkPromoCodes(count, prefix)
    const createdCodes: PromoCode[] = []

    for (const code of codes) {
      const promoCode = await create({
        ...baseInput,
        editionId,
        code
      })
      createdCodes.push(promoCode)
    }

    return {
      success: true,
      codes: createdCodes,
      count: createdCodes.length
    }
  }

  /**
   * Deactivate a promo code
   */
  async function deactivate(id: string): Promise<PromoCode> {
    return update(id, { isActive: false })
  }

  /**
   * Activate a promo code
   */
  async function activate(id: string): Promise<PromoCode> {
    return update(id, { isActive: true })
  }

  /**
   * Export promo codes with usage data
   */
  async function exportWithUsage(editionId: string): Promise<
    {
      code: PromoCode
      stats: PromoCodeStats
    }[]
  > {
    const codes = await listByEdition(editionId)
    const result: { code: PromoCode; stats: PromoCodeStats }[] = []

    for (const code of codes) {
      const stats = await getStats(code.id)
      result.push({ code, stats })
    }

    return result
  }

  return {
    create,
    update,
    remove,
    getById,
    getByCode,
    listByEdition,
    validate,
    applyToOrder,
    recordUsage,
    getUserUsageCount,
    getUsageHistory,
    getStats,
    bulkCreate,
    deactivate,
    activate,
    exportWithUsage
  }
}

export type PromoCodeService = ReturnType<typeof createPromoCodeService>

// Helper functions

function mapRecordToPromoCode(record: Record<string, unknown>): PromoCode {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    code: record.code as string,
    name: record.name as string,
    description: record.description as string | undefined,
    discountType: record.discountType as PromoCode['discountType'],
    discountValue: record.discountValue as number,
    minOrderAmount: record.minOrderAmount as number | undefined,
    maxUsageCount: record.maxUsageCount as number | undefined,
    maxUsagePerPerson: record.maxUsagePerPerson as number | undefined,
    currentUsageCount: (record.currentUsageCount as number) || 0,
    applicableTicketTypeIds: record.applicableTicketTypeIds as string[] | undefined,
    startsAt: record.startsAt ? new Date(record.startsAt as string) : undefined,
    expiresAt: record.expiresAt ? new Date(record.expiresAt as string) : undefined,
    isActive: record.isActive as boolean,
    createdBy: record.createdBy as string,
    created: new Date(record.created as string),
    updated: new Date(record.updated as string)
  }
}

function mapRecordToPromoCodeUsage(record: Record<string, unknown>): PromoCodeUsage {
  return {
    id: record.id as string,
    promoCodeId: record.promoCodeId as string,
    orderId: record.orderId as string,
    email: record.email as string,
    discountAmount: record.discountAmount as number,
    created: new Date(record.created as string)
  }
}
