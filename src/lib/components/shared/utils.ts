/**
 * Shared utility functions for UI components.
 */

/**
 * Formats a date for display.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date

  if (Number.isNaN(d.getTime())) return ''

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }

  return d.toLocaleDateString(undefined, defaultOptions)
}

/**
 * Formats a date with time.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formats a relative time (e.g., "2 days ago").
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(d)
}

/**
 * Status color mapping for common statuses.
 */
export type StatusType =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'confirmed'
  | 'declined'
  | 'withdrawn'
  | 'cancelled'
  | 'paid'
  | 'refunded'
  | 'used'
  | 'active'
  | 'inactive'
  | 'published'
  | 'archived'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

export type StatusColor = 'gray' | 'yellow' | 'blue' | 'green' | 'red' | 'purple' | 'orange'

const STATUS_COLORS: Record<StatusType, StatusColor> = {
  // CFP statuses
  draft: 'gray',
  pending: 'yellow',
  submitted: 'blue',
  under_review: 'purple',
  accepted: 'green',
  rejected: 'red',
  confirmed: 'green',
  declined: 'red',
  withdrawn: 'gray',

  // Billing statuses
  cancelled: 'gray',
  paid: 'green',
  refunded: 'orange',
  used: 'purple',

  // General statuses
  active: 'green',
  inactive: 'gray',
  published: 'green',
  archived: 'gray',

  // Alert types
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue'
}

/**
 * Gets the color class for a status.
 */
export function getStatusColor(status: string): StatusColor {
  const normalizedStatus = status.toLowerCase().replace(/[-\s]/g, '_') as StatusType
  return STATUS_COLORS[normalizedStatus] || 'gray'
}

/**
 * Gets Tailwind classes for a status color.
 */
export function getStatusClasses(status: string): { bg: string; text: string; border: string } {
  const color = getStatusColor(status)

  const colorMap: Record<StatusColor, { bg: string; text: string; border: string }> = {
    gray: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800'
    }
  }

  return colorMap[color]
}

/**
 * Formats a currency amount.
 */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  options: { cents?: boolean } = {}
): string {
  const value = options.cents ? amount / 100 : amount

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  }).format(value)
}

/**
 * Formats a number with thousand separators.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value)
}

/**
 * Truncates text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}
