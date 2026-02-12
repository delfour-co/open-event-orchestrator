/**
 * Secret Link Domain
 *
 * Handles secret submission links for post-deadline CFP submissions.
 * Allows organizers to invite specific speakers after the CFP is closed.
 */

import { z } from 'zod'

/**
 * Secret link token prefix
 */
export const SECRET_LINK_PREFIX = 'cfp_'

/**
 * Secret link token length (excluding prefix)
 */
export const SECRET_LINK_TOKEN_LENGTH = 32

/**
 * Secret link schema
 */
export const secretLinkSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  token: z.string(),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.date().optional(),
  maxSubmissions: z.number().int().min(1).max(100).optional(),
  usedSubmissions: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SecretLink = z.infer<typeof secretLinkSchema>

export const createSecretLinkSchema = secretLinkSchema.omit({
  id: true,
  token: true,
  usedSubmissions: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSecretLink = z.infer<typeof createSecretLinkSchema>

export const updateSecretLinkSchema = z.object({
  id: z.string(),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.date().nullable().optional(),
  maxSubmissions: z.number().int().min(1).max(100).nullable().optional(),
  isActive: z.boolean().optional()
})

export type UpdateSecretLink = z.infer<typeof updateSecretLinkSchema>

/**
 * Secret link validation result
 */
export interface SecretLinkValidation {
  valid: boolean
  error?: SecretLinkValidationError
  link?: SecretLink
}

export type SecretLinkValidationError =
  | 'not_found'
  | 'expired'
  | 'limit_reached'
  | 'inactive'
  | 'invalid_token'

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
export function generateSecretToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  // Use crypto API if available, otherwise fall back to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(SECRET_LINK_TOKEN_LENGTH)
    crypto.getRandomValues(array)
    for (let i = 0; i < SECRET_LINK_TOKEN_LENGTH; i++) {
      token += chars[array[i] % chars.length]
    }
  } else {
    for (let i = 0; i < SECRET_LINK_TOKEN_LENGTH; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }

  return `${SECRET_LINK_PREFIX}${token}`
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token.startsWith(SECRET_LINK_PREFIX)) {
    return false
  }

  const tokenPart = token.slice(SECRET_LINK_PREFIX.length)
  if (tokenPart.length !== SECRET_LINK_TOKEN_LENGTH) {
    return false
  }

  return /^[A-Za-z0-9]+$/.test(tokenPart)
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a secret link is expired
 */
export function isSecretLinkExpired(link: SecretLink): boolean {
  if (!link.expiresAt) {
    return false
  }
  return new Date() > link.expiresAt
}

/**
 * Check if a secret link has reached its submission limit
 */
export function hasReachedSubmissionLimit(link: SecretLink): boolean {
  if (!link.maxSubmissions) {
    return false
  }
  return link.usedSubmissions >= link.maxSubmissions
}

/**
 * Get remaining submissions for a secret link
 */
export function getRemainingSubmissions(link: SecretLink): number | null {
  if (!link.maxSubmissions) {
    return null // Unlimited
  }
  return Math.max(0, link.maxSubmissions - link.usedSubmissions)
}

/**
 * Validate a secret link for submission
 */
export function validateSecretLink(link: SecretLink | null): SecretLinkValidation {
  if (!link) {
    return { valid: false, error: 'not_found' }
  }

  if (!link.isActive) {
    return { valid: false, error: 'inactive', link }
  }

  if (isSecretLinkExpired(link)) {
    return { valid: false, error: 'expired', link }
  }

  if (hasReachedSubmissionLimit(link)) {
    return { valid: false, error: 'limit_reached', link }
  }

  return { valid: true, link }
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get validation error message
 */
export function getSecretLinkErrorMessage(error: SecretLinkValidationError): string {
  const messages: Record<SecretLinkValidationError, string> = {
    not_found: 'This submission link is invalid or does not exist.',
    expired: 'This submission link has expired.',
    limit_reached: 'This submission link has reached its maximum number of submissions.',
    inactive: 'This submission link has been deactivated.',
    invalid_token: 'The submission link format is invalid.'
  }
  return messages[error]
}

/**
 * Get secret link status
 */
export function getSecretLinkStatus(
  link: SecretLink
): 'active' | 'expired' | 'limit_reached' | 'inactive' {
  if (!link.isActive) {
    return 'inactive'
  }
  if (isSecretLinkExpired(link)) {
    return 'expired'
  }
  if (hasReachedSubmissionLimit(link)) {
    return 'limit_reached'
  }
  return 'active'
}

/**
 * Get secret link status label
 */
export function getSecretLinkStatusLabel(link: SecretLink): string {
  const status = getSecretLinkStatus(link)
  const labels: Record<typeof status, string> = {
    active: 'Active',
    expired: 'Expired',
    limit_reached: 'Limit Reached',
    inactive: 'Inactive'
  }
  return labels[status]
}

/**
 * Get secret link status color
 */
export function getSecretLinkStatusColor(link: SecretLink): string {
  const status = getSecretLinkStatus(link)
  const colors: Record<typeof status, string> = {
    active: '#22c55e', // green-500
    expired: '#f59e0b', // amber-500
    limit_reached: '#f97316', // orange-500
    inactive: '#94a3b8' // slate-400
  }
  return colors[status]
}

/**
 * Build secret link URL
 */
export function buildSecretLinkUrl(baseUrl: string, editionSlug: string, token: string): string {
  return `${baseUrl}/cfp/${editionSlug}/submit?token=${token}`
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(date: Date | undefined): string {
  if (!date) {
    return 'Never'
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format submission limit for display
 */
export function formatSubmissionLimit(link: SecretLink): string {
  if (!link.maxSubmissions) {
    return 'Unlimited'
  }
  return `${link.usedSubmissions}/${link.maxSubmissions}`
}
