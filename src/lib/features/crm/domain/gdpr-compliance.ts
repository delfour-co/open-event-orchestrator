/**
 * GDPR Compliance Domain Entity
 *
 * Types and utilities for GDPR compliance including double opt-in,
 * consent management, data export, and data retention.
 */

import { z } from 'zod'

// Email status for double opt-in flow
export const emailStatusSchema = z.enum(['pending', 'confirmed', 'active', 'unsubscribed'])
export type EmailStatus = z.infer<typeof emailStatusSchema>

// Consent audit action types
export const consentAuditActionSchema = z.enum([
  'granted',
  'withdrawn',
  'confirmed',
  'unsubscribed',
  'preferences_updated',
  'data_exported',
  'data_deleted'
])
export type ConsentAuditAction = z.infer<typeof consentAuditActionSchema>

// Extended consent types for communication preferences
export const communicationTypeSchema = z.enum([
  'marketing_email',
  'newsletter',
  'event_updates',
  'partner_communications',
  'data_sharing',
  'analytics'
])
export type CommunicationType = z.infer<typeof communicationTypeSchema>

// Communication frequency preferences
export const communicationFrequencySchema = z.enum(['immediate', 'daily', 'weekly', 'monthly'])
export type CommunicationFrequency = z.infer<typeof communicationFrequencySchema>

// Consent audit source types
export const auditSourceSchema = z.enum([
  'form',
  'import',
  'api',
  'manual',
  'preference_center',
  'unsubscribe_link',
  'double_opt_in',
  'gdpr_request'
])
export type AuditSource = z.infer<typeof auditSourceSchema>

// Consent audit log entry
export const consentAuditLogSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  consentId: z.string().optional(),
  action: consentAuditActionSchema,
  consentType: communicationTypeSchema.optional(),
  source: auditSourceSchema,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date()
})

export type ConsentAuditLog = z.infer<typeof consentAuditLogSchema>

export interface CreateConsentAuditLog {
  contactId: string
  consentId?: string
  action: ConsentAuditAction
  consentType?: CommunicationType
  source: AuditSource
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

// Communication preferences
export const communicationPreferencesSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  eventId: z.string().optional(),
  newsletter: z.boolean().default(false),
  eventUpdates: z.boolean().default(true),
  partnerCommunications: z.boolean().default(false),
  frequency: communicationFrequencySchema.default('immediate'),
  preferenceToken: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CommunicationPreferences = z.infer<typeof communicationPreferencesSchema>

export interface UpdateCommunicationPreferences {
  newsletter?: boolean
  eventUpdates?: boolean
  partnerCommunications?: boolean
  frequency?: CommunicationFrequency
}

// Data retention policy
export const dataRetentionPolicySchema = z.object({
  id: z.string(),
  eventId: z.string().optional(),
  dataType: z.string(),
  retentionDays: z.number().int().min(1).max(3650),
  warningDays: z.number().int().min(1).max(365).optional(),
  autoDelete: z.boolean().default(false),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type DataRetentionPolicy = z.infer<typeof dataRetentionPolicySchema>

export interface CreateDataRetentionPolicy {
  eventId?: string
  dataType: string
  retentionDays: number
  warningDays?: number
  autoDelete?: boolean
  description?: string
}

// Double opt-in confirmation token
export interface ConfirmationToken {
  token: string
  expiresAt: Date
}

// GDPR data export result
export interface GdprDataExport {
  contact: {
    id: string
    email: string
    firstName: string
    lastName: string
    company?: string
    jobTitle?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    createdAt: Date
    updatedAt: Date
  }
  consents: Array<{
    type: string
    status: string
    grantedAt?: Date
    withdrawnAt?: Date
    source: string
  }>
  activities: Array<{
    type: string
    description: string
    createdAt: Date
  }>
  orders: Array<{
    id: string
    totalAmount: number
    status: string
    createdAt: Date
  }>
  tickets: Array<{
    id: string
    ticketTypeName: string
    status: string
    createdAt: Date
  }>
  talks: Array<{
    id: string
    title: string
    status: string
    submittedAt: Date
  }>
  auditLog: Array<{
    action: string
    source: string
    createdAt: Date
  }>
  exportedAt: Date
}

// Configuration constants
export const GDPR_CONFIG = {
  // Double opt-in settings
  CONFIRMATION_TOKEN_LENGTH: 64,
  CONFIRMATION_TOKEN_EXPIRY_HOURS: 48,
  MAX_REMINDER_COUNT: 3,
  REMINDER_INTERVAL_DAYS: 3,

  // Data retention defaults (in days)
  DEFAULT_RETENTION: {
    contact: 1095, // 3 years
    consent: 1825, // 5 years (legal requirement)
    activity: 365, // 1 year
    order: 2555, // 7 years (accounting requirement)
    ticket: 365 // 1 year
  },

  // Warning before expiration (in days)
  DEFAULT_WARNING_DAYS: 30
} as const

// Communication type labels for UI
export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  marketing_email: 'Marketing Emails',
  newsletter: 'Newsletter',
  event_updates: 'Event Updates',
  partner_communications: 'Partner Communications',
  data_sharing: 'Data Sharing',
  analytics: 'Analytics & Personalization'
}

// Communication type descriptions for preference center
export const COMMUNICATION_TYPE_DESCRIPTIONS: Record<CommunicationType, string> = {
  marketing_email: 'Promotional emails about our products and services',
  newsletter: 'Regular newsletter with news and updates',
  event_updates: 'Updates about events you are interested in or attending',
  partner_communications: 'Communications from our partners and sponsors',
  data_sharing: 'Share your data with partners for personalized offers',
  analytics: 'Use your data to personalize your experience'
}

// Frequency labels for UI
export const FREQUENCY_LABELS: Record<CommunicationFrequency, string> = {
  immediate: 'Immediately',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
  monthly: 'Monthly digest'
}

// Email status labels
export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  active: 'Active',
  unsubscribed: 'Unsubscribed'
}

/**
 * Generate a secure random token for confirmation links
 */
export function generateConfirmationToken(): ConfirmationToken {
  const bytes = new Uint8Array(GDPR_CONFIG.CONFIRMATION_TOKEN_LENGTH / 2)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + GDPR_CONFIG.CONFIRMATION_TOKEN_EXPIRY_HOURS)

  return { token, expiresAt }
}

/**
 * Check if a confirmation token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Check if a contact should receive a reminder
 */
export function shouldSendReminder(
  lastReminderSentAt: Date | undefined,
  reminderCount: number
): boolean {
  if (reminderCount >= GDPR_CONFIG.MAX_REMINDER_COUNT) {
    return false
  }

  if (!lastReminderSentAt) {
    return true
  }

  const daysSinceLastReminder =
    (new Date().getTime() - lastReminderSentAt.getTime()) / (1000 * 60 * 60 * 24)

  return daysSinceLastReminder >= GDPR_CONFIG.REMINDER_INTERVAL_DAYS
}

/**
 * Calculate expiration date based on retention policy
 */
export function calculateExpirationDate(createdAt: Date, retentionDays: number): Date {
  const expirationDate = new Date(createdAt)
  expirationDate.setDate(expirationDate.getDate() + retentionDays)
  return expirationDate
}

/**
 * Check if data is approaching expiration
 */
export function isApproachingExpiration(
  createdAt: Date,
  retentionDays: number,
  warningDays: number
): boolean {
  const expirationDate = calculateExpirationDate(createdAt, retentionDays)
  const warningDate = new Date(expirationDate)
  warningDate.setDate(warningDate.getDate() - warningDays)

  return new Date() >= warningDate
}

/**
 * Check if data has expired
 */
export function isExpired(createdAt: Date, retentionDays: number): boolean {
  const expirationDate = calculateExpirationDate(createdAt, retentionDays)
  return new Date() > expirationDate
}

/**
 * Generate preference center token
 */
export function generatePreferenceToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Build List-Unsubscribe header value (RFC 8058)
 */
export function buildListUnsubscribeHeader(
  unsubscribeUrl: string,
  unsubscribeEmail?: string
): string {
  const parts: string[] = [`<${unsubscribeUrl}>`]
  if (unsubscribeEmail) {
    parts.push(`<mailto:${unsubscribeEmail}>`)
  }
  return parts.join(', ')
}

/**
 * Build List-Unsubscribe-Post header value (RFC 8058)
 */
export function buildListUnsubscribePostHeader(): string {
  return 'List-Unsubscribe=One-Click'
}
