/**
 * A/B Testing Domain Entity
 *
 * Manages A/B test campaigns with variants, winner selection, and results.
 */

import { z } from 'zod'

export const abTestStatusSchema = z.enum([
  'draft',
  'testing',
  'winner_selected',
  'completed',
  'cancelled'
])
export type AbTestStatus = z.infer<typeof abTestStatusSchema>

export const testVariableSchema = z.enum(['subject', 'content', 'sender_name', 'send_time'])
export type TestVariable = z.infer<typeof testVariableSchema>

export const winnerCriteriaSchema = z.enum(['open_rate', 'click_rate'])
export type WinnerCriteria = z.infer<typeof winnerCriteriaSchema>

export const variantNameSchema = z.enum(['A', 'B', 'C'])
export type VariantName = z.infer<typeof variantNameSchema>

export const abTestVariantSchema = z.object({
  id: z.string(),
  testId: z.string(),
  name: variantNameSchema,
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  senderName: z.string().optional(),
  scheduledAt: z.date().optional(),
  recipientCount: z.number().int().min(0).default(0),
  sentCount: z.number().int().min(0).default(0),
  deliveredCount: z.number().int().min(0).default(0),
  openedCount: z.number().int().min(0).default(0),
  clickedCount: z.number().int().min(0).default(0),
  bouncedCount: z.number().int().min(0).default(0),
  isWinner: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AbTestVariant = z.infer<typeof abTestVariantSchema>

export const abTestCampaignSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  editionId: z.string().optional(),
  name: z.string().min(1).max(200),
  segmentId: z.string().optional(),
  testVariable: testVariableSchema,
  winnerCriteria: winnerCriteriaSchema,
  testPercentage: z.number().min(10).max(50).default(20),
  testDurationHours: z.number().min(1).max(168).default(24),
  status: abTestStatusSchema.default('draft'),
  winnerVariantId: z.string().optional(),
  winnerSelectedAt: z.date().optional(),
  testStartedAt: z.date().optional(),
  testEndedAt: z.date().optional(),
  totalRecipients: z.number().int().min(0).default(0),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type AbTestCampaign = z.infer<typeof abTestCampaignSchema>

export interface CreateAbTestCampaign {
  eventId: string
  editionId?: string
  name: string
  segmentId?: string
  testVariable: TestVariable
  winnerCriteria: WinnerCriteria
  testPercentage?: number
  testDurationHours?: number
  createdBy?: string
}

export interface CreateAbTestVariant {
  testId: string
  name: VariantName
  subject: string
  htmlContent: string
  textContent?: string
  senderName?: string
  scheduledAt?: Date
}

export interface UpdateAbTestVariant {
  subject?: string
  htmlContent?: string
  textContent?: string
  senderName?: string
  scheduledAt?: Date
}

export interface VariantStats {
  variantId: string
  name: VariantName
  recipientCount: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  bouncedCount: number
  openRate: number
  clickRate: number
  bounceRate: number
  deliveryRate: number
}

export interface AbTestResults {
  testId: string
  status: AbTestStatus
  winnerVariantId?: string
  variants: VariantStats[]
  testDuration: number // in hours
  totalRecipients: number
  statisticalSignificance?: number
}

// Status labels for UI
export const AB_TEST_STATUS_LABELS: Record<AbTestStatus, string> = {
  draft: 'Draft',
  testing: 'Testing',
  winner_selected: 'Winner Selected',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

// Test variable labels
export const TEST_VARIABLE_LABELS: Record<TestVariable, string> = {
  subject: 'Subject Line',
  content: 'Email Content',
  sender_name: 'Sender Name',
  send_time: 'Send Time'
}

// Winner criteria labels
export const WINNER_CRITERIA_LABELS: Record<WinnerCriteria, string> = {
  open_rate: 'Open Rate',
  click_rate: 'Click Rate'
}

// Variant colors for charts
export const VARIANT_COLORS: Record<VariantName, string> = {
  A: '#3b82f6', // blue
  B: '#10b981', // green
  C: '#f59e0b' // amber
}

/**
 * Calculate open rate percentage
 */
export function calculateOpenRate(opened: number, delivered: number): number {
  if (delivered === 0) return 0
  return Math.round((opened / delivered) * 1000) / 10
}

/**
 * Calculate click rate percentage
 */
export function calculateClickRate(clicked: number, delivered: number): number {
  if (delivered === 0) return 0
  return Math.round((clicked / delivered) * 1000) / 10
}

/**
 * Calculate bounce rate percentage
 */
export function calculateBounceRate(bounced: number, sent: number): number {
  if (sent === 0) return 0
  return Math.round((bounced / sent) * 1000) / 10
}

/**
 * Calculate delivery rate percentage
 */
export function calculateDeliveryRate(delivered: number, sent: number): number {
  if (sent === 0) return 0
  return Math.round((delivered / sent) * 1000) / 10
}

/**
 * Build variant stats from variant data
 */
export function buildVariantStats(variant: AbTestVariant): VariantStats {
  return {
    variantId: variant.id,
    name: variant.name,
    recipientCount: variant.recipientCount,
    sentCount: variant.sentCount,
    deliveredCount: variant.deliveredCount,
    openedCount: variant.openedCount,
    clickedCount: variant.clickedCount,
    bouncedCount: variant.bouncedCount,
    openRate: calculateOpenRate(variant.openedCount, variant.deliveredCount),
    clickRate: calculateClickRate(variant.clickedCount, variant.deliveredCount),
    bounceRate: calculateBounceRate(variant.bouncedCount, variant.sentCount),
    deliveryRate: calculateDeliveryRate(variant.deliveredCount, variant.sentCount)
  }
}

/**
 * Determine winner variant based on criteria
 */
export function determineWinner(
  variants: VariantStats[],
  criteria: WinnerCriteria
): VariantStats | null {
  if (variants.length === 0) return null

  const metric = criteria === 'open_rate' ? 'openRate' : 'clickRate'

  return variants.reduce((best, current) => {
    if (current[metric] > best[metric]) return current
    return best
  }, variants[0])
}

/**
 * Check if test duration has elapsed
 */
export function isTestDurationElapsed(startedAt: Date, durationHours: number): boolean {
  const now = new Date()
  const elapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
  return elapsed >= durationHours
}

/**
 * Calculate remaining test time in hours
 */
export function getRemainingTestTime(startedAt: Date, durationHours: number): number {
  const now = new Date()
  const elapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
  return Math.max(0, durationHours - elapsed)
}

/**
 * Calculate statistical significance (simplified z-test)
 */
export function calculateStatisticalSignificance(
  rate1: number,
  n1: number,
  rate2: number,
  n2: number
): number {
  if (n1 === 0 || n2 === 0) return 0

  const p1 = rate1 / 100
  const p2 = rate2 / 100
  const pPooled = (p1 * n1 + p2 * n2) / (n1 + n2)

  if (pPooled === 0 || pPooled === 1) return 0

  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2))
  if (se === 0) return 0

  const z = Math.abs(p1 - p2) / se

  // Approximate confidence level from z-score
  if (z >= 2.576) return 99
  if (z >= 1.96) return 95
  if (z >= 1.645) return 90
  if (z >= 1.282) return 80
  return Math.round(z * 40)
}

/**
 * Split recipients into variant groups
 */
export function splitRecipients<T>(
  recipients: T[],
  testPercentage: number,
  variantCount: number
): Map<VariantName, T[]> {
  const result = new Map<VariantName, T[]>()
  const variantNames: VariantName[] = ['A', 'B', 'C'].slice(0, variantCount) as VariantName[]

  const testCount = Math.ceil((recipients.length * testPercentage) / 100)
  const perVariant = Math.ceil(testCount / variantCount)

  // Shuffle recipients for random distribution
  const shuffled = [...recipients].sort(() => Math.random() - 0.5)

  let index = 0
  for (const variantName of variantNames) {
    const variantRecipients = shuffled.slice(index, index + perVariant)
    result.set(variantName, variantRecipients)
    index += perVariant
  }

  return result
}

/**
 * Get remaining recipients (not in test groups)
 */
export function getRemainingRecipients<T>(
  allRecipients: T[],
  testGroups: Map<VariantName, T[]>
): T[] {
  const testRecipientSet = new Set<T>()
  for (const group of testGroups.values()) {
    for (const recipient of group) {
      testRecipientSet.add(recipient)
    }
  }
  return allRecipients.filter((r) => !testRecipientSet.has(r))
}

/**
 * Check if A/B test can be started
 */
export function canStartTest(
  test: AbTestCampaign,
  variantCount: number
): { can: boolean; reason?: string } {
  if (test.status !== 'draft') {
    return { can: false, reason: 'Test must be in draft status' }
  }

  if (variantCount < 2) {
    return { can: false, reason: 'At least 2 variants are required' }
  }

  if (test.totalRecipients < variantCount * 10) {
    return { can: false, reason: 'Not enough recipients for meaningful test' }
  }

  return { can: true }
}

/**
 * Check if winner can be selected manually
 */
export function canSelectWinner(test: AbTestCampaign): boolean {
  return test.status === 'testing'
}

/**
 * Format test duration for display
 */
export function formatTestDuration(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`
  }
  return `${days} day${days !== 1 ? 's' : ''} ${remainingHours}h`
}
