/**
 * Waitlist Domain
 *
 * Manages waitlist entries for sold-out ticket types.
 * Supports FIFO queue, notifications, and time-limited purchase windows.
 */

import { z } from 'zod'

// ============================================================================
// Constants
// ============================================================================

/**
 * Waitlist entry statuses
 */
export const WAITLIST_STATUSES = [
  'waiting', // In queue, not yet notified
  'notified', // Notification sent, waiting for purchase
  'purchased', // Successfully purchased
  'expired', // Purchase window expired
  'cancelled' // User cancelled
] as const

/**
 * Default purchase window duration in hours
 */
export const DEFAULT_PURCHASE_WINDOW_HOURS = 24

/**
 * Maximum entries per person per edition
 */
export const MAX_WAITLIST_ENTRIES_PER_EMAIL = 5

// ============================================================================
// Schemas
// ============================================================================

export const waitlistStatusSchema = z.enum(WAITLIST_STATUSES)
export type WaitlistStatus = z.infer<typeof waitlistStatusSchema>

/**
 * Waitlist entry schema
 */
export const waitlistEntrySchema = z.object({
  id: z.string(),
  editionId: z.string(),
  ticketTypeId: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  status: waitlistStatusSchema.default('waiting'),
  position: z.number().int().min(1), // Queue position
  notifiedAt: z.date().optional(),
  purchaseWindowEnd: z.date().optional(), // When the purchase window expires
  purchasedAt: z.date().optional(),
  orderId: z.string().optional(), // Linked order if purchased
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>

/**
 * Create waitlist entry schema
 */
export const createWaitlistEntrySchema = waitlistEntrySchema.omit({
  id: true,
  status: true,
  position: true,
  notifiedAt: true,
  purchaseWindowEnd: true,
  purchasedAt: true,
  orderId: true,
  createdAt: true,
  updatedAt: true
})

export type CreateWaitlistEntry = z.infer<typeof createWaitlistEntrySchema>

/**
 * Update waitlist entry schema
 */
export const updateWaitlistEntrySchema = z.object({
  status: waitlistStatusSchema.optional(),
  notifiedAt: z.date().optional(),
  purchaseWindowEnd: z.date().optional(),
  purchasedAt: z.date().optional(),
  orderId: z.string().optional()
})

export type UpdateWaitlistEntry = z.infer<typeof updateWaitlistEntrySchema>

/**
 * Waitlist settings per edition
 */
export const waitlistSettingsSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  isEnabled: z.boolean().default(true),
  purchaseWindowHours: z.number().int().min(1).max(168).default(24), // Max 7 days
  maxEntriesPerEmail: z.number().int().min(1).max(10).default(5),
  notifyBatchSize: z.number().int().min(1).max(100).default(10), // How many to notify at once
  autoNotify: z.boolean().default(true), // Auto-notify when tickets available
  requireConfirmation: z.boolean().default(false), // Require confirmation before purchase
  createdAt: z.date(),
  updatedAt: z.date()
})

export type WaitlistSettings = z.infer<typeof waitlistSettingsSchema>

/**
 * Create waitlist settings schema
 */
export const createWaitlistSettingsSchema = waitlistSettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateWaitlistSettings = z.infer<typeof createWaitlistSettingsSchema>

/**
 * Update waitlist settings schema
 */
export const updateWaitlistSettingsSchema = createWaitlistSettingsSchema.partial()

export type UpdateWaitlistSettings = z.infer<typeof updateWaitlistSettingsSchema>

/**
 * Waitlist notification record
 */
export const waitlistNotificationSchema = z.object({
  id: z.string(),
  waitlistEntryId: z.string(),
  type: z.enum(['available', 'reminder', 'expired']),
  sentAt: z.date(),
  emailId: z.string().optional() // Reference to email log
})

export type WaitlistNotification = z.infer<typeof waitlistNotificationSchema>

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate waitlist entry
 */
export function validateWaitlistEntry(data: unknown): WaitlistEntry {
  return waitlistEntrySchema.parse(data)
}

/**
 * Validate create waitlist entry
 */
export function validateCreateWaitlistEntry(data: unknown): CreateWaitlistEntry {
  return createWaitlistEntrySchema.parse(data)
}

/**
 * Validate waitlist settings
 */
export function validateWaitlistSettings(data: unknown): WaitlistSettings {
  return waitlistSettingsSchema.parse(data)
}

// ============================================================================
// Status Check Functions
// ============================================================================

/**
 * Check if entry is waiting in queue
 */
export function isWaiting(entry: WaitlistEntry): boolean {
  return entry.status === 'waiting'
}

/**
 * Check if entry has been notified
 */
export function isNotified(entry: WaitlistEntry): boolean {
  return entry.status === 'notified'
}

/**
 * Check if entry was purchased
 */
export function isPurchased(entry: WaitlistEntry): boolean {
  return entry.status === 'purchased'
}

/**
 * Check if entry has expired
 */
export function isExpired(entry: WaitlistEntry): boolean {
  return entry.status === 'expired'
}

/**
 * Check if entry was cancelled
 */
export function isCancelled(entry: WaitlistEntry): boolean {
  return entry.status === 'cancelled'
}

/**
 * Check if entry is active (waiting or notified)
 */
export function isActiveEntry(entry: WaitlistEntry): boolean {
  return entry.status === 'waiting' || entry.status === 'notified'
}

/**
 * Check if entry is in purchase window
 */
export function isInPurchaseWindow(entry: WaitlistEntry): boolean {
  if (entry.status !== 'notified') return false
  if (!entry.purchaseWindowEnd) return false
  return new Date() < entry.purchaseWindowEnd
}

/**
 * Check if purchase window has expired
 */
export function hasPurchaseWindowExpired(entry: WaitlistEntry): boolean {
  if (entry.status !== 'notified') return false
  if (!entry.purchaseWindowEnd) return false
  return new Date() >= entry.purchaseWindowEnd
}

// ============================================================================
// Queue Management Functions
// ============================================================================

/**
 * Get next position in queue for a ticket type
 */
export function getNextPosition(entries: WaitlistEntry[]): number {
  if (entries.length === 0) return 1
  return Math.max(...entries.map((e) => e.position)) + 1
}

/**
 * Sort entries by position (FIFO)
 */
export function sortByPosition(entries: WaitlistEntry[]): WaitlistEntry[] {
  return [...entries].sort((a, b) => a.position - b.position)
}

/**
 * Get waiting entries in FIFO order
 */
export function getWaitingEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  return sortByPosition(entries.filter(isWaiting))
}

/**
 * Get notified entries
 */
export function getNotifiedEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  return sortByPosition(entries.filter(isNotified))
}

/**
 * Get entries with expired purchase window
 */
export function getExpiredEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  return entries.filter(hasPurchaseWindowExpired)
}

/**
 * Get next entries to notify based on available tickets
 */
export function getEntriesToNotify(
  entries: WaitlistEntry[],
  availableTickets: number,
  maxBatchSize: number
): WaitlistEntry[] {
  const waiting = getWaitingEntries(entries)
  const toNotify: WaitlistEntry[] = []
  let ticketsAssigned = 0

  for (const entry of waiting) {
    if (ticketsAssigned + entry.quantity <= availableTickets && toNotify.length < maxBatchSize) {
      toNotify.push(entry)
      ticketsAssigned += entry.quantity
    }
  }

  return toNotify
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get status label for display
 */
export function getWaitlistStatusLabel(status: WaitlistStatus): string {
  const labels: Record<WaitlistStatus, string> = {
    waiting: 'Waiting',
    notified: 'Notified',
    purchased: 'Purchased',
    expired: 'Expired',
    cancelled: 'Cancelled'
  }
  return labels[status]
}

/**
 * Get status color for UI
 */
export function getWaitlistStatusColor(status: WaitlistStatus): string {
  const colors: Record<WaitlistStatus, string> = {
    waiting: 'yellow',
    notified: 'blue',
    purchased: 'green',
    expired: 'gray',
    cancelled: 'red'
  }
  return colors[status]
}

/**
 * Format queue position for display
 */
export function formatQueuePosition(position: number): string {
  if (position === 1) return '1st'
  if (position === 2) return '2nd'
  if (position === 3) return '3rd'
  return `${position}th`
}

/**
 * Get entry full name
 */
export function getEntryFullName(entry: Pick<WaitlistEntry, 'firstName' | 'lastName'>): string {
  return `${entry.firstName} ${entry.lastName}`.trim()
}

// ============================================================================
// Time Calculation Functions
// ============================================================================

/**
 * Calculate purchase window end date
 */
export function calculatePurchaseWindowEnd(
  notifiedAt: Date,
  windowHours: number = DEFAULT_PURCHASE_WINDOW_HOURS
): Date {
  const end = new Date(notifiedAt)
  end.setHours(end.getHours() + windowHours)
  return end
}

/**
 * Get remaining time in purchase window
 */
export function getRemainingPurchaseTime(entry: WaitlistEntry): {
  hasTime: boolean
  hours: number
  minutes: number
  formatted: string
} {
  if (!entry.purchaseWindowEnd) {
    return { hasTime: false, hours: 0, minutes: 0, formatted: 'No window' }
  }

  const now = new Date()
  const diff = entry.purchaseWindowEnd.getTime() - now.getTime()

  if (diff <= 0) {
    return { hasTime: false, hours: 0, minutes: 0, formatted: 'Expired' }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  let formatted: string
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`
  } else {
    formatted = `${minutes}m`
  }

  return { hasTime: true, hours, minutes, formatted }
}

/**
 * Format notification date
 */
export function formatNotificationDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Waitlist statistics for a ticket type
 */
export interface WaitlistStats {
  totalEntries: number
  waiting: number
  notified: number
  purchased: number
  expired: number
  cancelled: number
  totalTicketsRequested: number
  conversionRate: number
  averageWaitTimeHours: number
}

/**
 * Calculate waitlist statistics
 */
export function calculateWaitlistStats(entries: WaitlistEntry[]): WaitlistStats {
  const waiting = entries.filter(isWaiting).length
  const notified = entries.filter(isNotified).length
  const purchased = entries.filter(isPurchased).length
  const expired = entries.filter(isExpired).length
  const cancelled = entries.filter(isCancelled).length

  const totalTicketsRequested = entries.reduce((sum, e) => sum + e.quantity, 0)
  const totalNotified = entries.filter((e) => e.notifiedAt).length
  const conversionRate = totalNotified > 0 ? (purchased / totalNotified) * 100 : 0

  // Calculate average wait time for purchased entries
  const purchasedEntries = entries.filter((e) => e.purchasedAt && e.createdAt)
  const averageWaitTimeHours =
    purchasedEntries.length > 0
      ? purchasedEntries.reduce((sum, e) => {
          const purchasedTime = e.purchasedAt?.getTime() ?? 0
          const waitTime = purchasedTime - e.createdAt.getTime()
          return sum + waitTime / (1000 * 60 * 60)
        }, 0) / purchasedEntries.length
      : 0

  return {
    totalEntries: entries.length,
    waiting,
    notified,
    purchased,
    expired,
    cancelled,
    totalTicketsRequested,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageWaitTimeHours: Math.round(averageWaitTimeHours * 10) / 10
  }
}

// ============================================================================
// Eligibility Functions
// ============================================================================

/**
 * Check if email can join waitlist
 */
export function canJoinWaitlist(
  email: string,
  ticketTypeId: string,
  existingEntries: WaitlistEntry[],
  maxEntriesPerEmail: number = MAX_WAITLIST_ENTRIES_PER_EMAIL
): { allowed: boolean; reason?: string } {
  // Check existing active entries for this email and ticket type
  const activeEntriesForTicketType = existingEntries.filter(
    (e) =>
      e.email.toLowerCase() === email.toLowerCase() &&
      e.ticketTypeId === ticketTypeId &&
      isActiveEntry(e)
  )

  if (activeEntriesForTicketType.length > 0) {
    return { allowed: false, reason: 'Already on waitlist for this ticket type' }
  }

  // Check total active entries for this email
  const totalActiveEntries = existingEntries.filter(
    (e) => e.email.toLowerCase() === email.toLowerCase() && isActiveEntry(e)
  )

  if (totalActiveEntries.length >= maxEntriesPerEmail) {
    return { allowed: false, reason: `Maximum ${maxEntriesPerEmail} waitlist entries reached` }
  }

  return { allowed: true }
}

/**
 * Check if entry can be cancelled
 */
export function canCancelEntry(entry: WaitlistEntry): boolean {
  return entry.status === 'waiting' || entry.status === 'notified'
}

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Get notification email subject
 */
export function getWaitlistEmailSubject(
  type: 'available' | 'reminder' | 'expired',
  ticketTypeName: string
): string {
  switch (type) {
    case 'available':
      return `Tickets available: ${ticketTypeName}`
    case 'reminder':
      return `Reminder: Complete your purchase - ${ticketTypeName}`
    case 'expired':
      return `Your reservation has expired - ${ticketTypeName}`
  }
}

/**
 * Build notification context for email template
 */
export function buildNotificationContext(
  entry: WaitlistEntry,
  ticketTypeName: string,
  purchaseUrl: string,
  eventName: string
): Record<string, string> {
  const remaining = getRemainingPurchaseTime(entry)

  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    fullName: getEntryFullName(entry),
    email: entry.email,
    ticketTypeName,
    quantity: entry.quantity.toString(),
    position: formatQueuePosition(entry.position),
    purchaseUrl,
    eventName,
    remainingTime: remaining.formatted,
    purchaseDeadline: entry.purchaseWindowEnd ? formatNotificationDate(entry.purchaseWindowEnd) : ''
  }
}

// ============================================================================
// Export Summary
// ============================================================================

/**
 * Export waitlist data for CSV
 */
export function exportWaitlistToCsv(entries: WaitlistEntry[]): string {
  const headers = [
    'Position',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Quantity',
    'Status',
    'Created',
    'Notified',
    'Purchased'
  ]

  const rows = sortByPosition(entries).map((entry) => [
    entry.position.toString(),
    entry.firstName,
    entry.lastName,
    entry.email,
    entry.phone || '',
    entry.quantity.toString(),
    getWaitlistStatusLabel(entry.status),
    entry.createdAt.toISOString(),
    entry.notifiedAt?.toISOString() || '',
    entry.purchasedAt?.toISOString() || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}
