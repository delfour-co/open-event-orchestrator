/**
 * Suppression List Domain Entity
 *
 * Manages email addresses that should never be contacted.
 * Addresses are added automatically on hard bounces, complaints, or unsubscribes,
 * or manually by admins.
 */

import { z } from 'zod'

export const suppressionReasonSchema = z.enum([
  'hard_bounce',
  'soft_bounce_limit',
  'complaint',
  'unsubscribe',
  'manual'
])

export type SuppressionReason = z.infer<typeof suppressionReasonSchema>

export const suppressionEntrySchema = z.object({
  id: z.string(),
  email: z.string().email(),
  reason: suppressionReasonSchema,
  source: z.string().optional(), // Campaign ID, admin user, or import batch
  note: z.string().optional(),
  organizationId: z.string().optional(), // null = global suppression
  eventId: z.string().optional(), // Specific event suppression
  createdAt: z.date(),
  createdBy: z.string().optional() // User ID if manually added
})

export type SuppressionEntry = z.infer<typeof suppressionEntrySchema>

export interface CreateSuppressionEntry {
  email: string
  reason: SuppressionReason
  source?: string
  note?: string
  organizationId?: string
  eventId?: string
  createdBy?: string
}

export interface BounceStats {
  contactId: string
  email: string
  hardBounces: number
  softBounces: number
  lastBounceAt?: Date
  lastBounceReason?: string
}

export interface SuppressionCheckResult {
  isSuppressed: boolean
  entry?: SuppressionEntry
  reason?: string
}

export interface SuppressionImportResult {
  total: number
  added: number
  duplicates: number
  invalid: number
  errors: string[]
}

// Configuration
export const SUPPRESSION_CONFIG = {
  /** Number of soft bounces before auto-suppression */
  SOFT_BOUNCE_THRESHOLD: 3,
  /** Number of hard bounces before auto-suppression (usually 1) */
  HARD_BOUNCE_THRESHOLD: 1
} as const

export const SUPPRESSION_REASON_LABELS: Record<SuppressionReason, string> = {
  hard_bounce: 'Hard Bounce',
  soft_bounce_limit: 'Soft Bounce Limit Exceeded',
  complaint: 'Spam Complaint',
  unsubscribe: 'Unsubscribed',
  manual: 'Manually Added'
}

/**
 * Check if an email should be suppressed based on bounce history
 */
export function shouldSuppress(stats: BounceStats): {
  suppress: boolean
  reason?: SuppressionReason
} {
  if (stats.hardBounces >= SUPPRESSION_CONFIG.HARD_BOUNCE_THRESHOLD) {
    return { suppress: true, reason: 'hard_bounce' }
  }
  if (stats.softBounces >= SUPPRESSION_CONFIG.SOFT_BOUNCE_THRESHOLD) {
    return { suppress: true, reason: 'soft_bounce_limit' }
  }
  return { suppress: false }
}

/**
 * Validate email format for suppression list
 */
export function isValidSuppressionEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

/**
 * Normalize email for consistent suppression checking
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Parse CSV content for suppression list import
 * Expects one email per line or CSV with email in first column
 */
export function parseSuppressionCsv(content: string): { emails: string[]; errors: string[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  const emails: string[] = []
  const errors: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Skip header row if detected
    if (
      i === 0 &&
      (line.toLowerCase().includes('email') || line.toLowerCase().includes('address'))
    ) {
      continue
    }

    // Extract email from CSV (first column) or plain text
    const parts = line.split(',')
    const email = parts[0].trim().replace(/^["']|["']$/g, '') // Remove quotes

    if (isValidSuppressionEmail(email)) {
      emails.push(normalizeEmail(email))
    } else {
      errors.push(`Line ${i + 1}: Invalid email "${email}"`)
    }
  }

  return { emails, errors }
}

/**
 * Format suppression entries for CSV export
 */
export function formatSuppressionCsv(entries: SuppressionEntry[]): string {
  const header = 'email,reason,source,note,created_at'
  const rows = entries.map((entry) => {
    const escapeCsv = (value: string | undefined) => {
      if (!value) return ''
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    return [
      entry.email,
      entry.reason,
      escapeCsv(entry.source),
      escapeCsv(entry.note),
      entry.createdAt.toISOString()
    ].join(',')
  })

  return [header, ...rows].join('\n')
}
