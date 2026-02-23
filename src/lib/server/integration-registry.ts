import { z } from 'zod'

/**
 * Integration status
 */
export const integrationStatusSchema = z.enum(['connected', 'not_configured', 'error'])
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>

/**
 * Integration type identifiers
 */
export const integrationTypeSchema = z.enum([
  'smtp',
  'stripe',
  'helloasso',
  'slack',
  'discord',
  'webhooks'
])
export type IntegrationType = z.infer<typeof integrationTypeSchema>

/**
 * Integration metadata
 */
export interface IntegrationInfo {
  type: IntegrationType
  name: string
  description: string
  icon: string
  configPath: string
  docsUrl?: string
}

/**
 * Integration status with details
 */
export interface IntegrationStatusInfo {
  type: IntegrationType
  status: IntegrationStatus
  message?: string
  lastChecked?: Date
  details?: Record<string, unknown>
}

/**
 * Integration registry entry combining info and status
 */
export interface IntegrationEntry {
  info: IntegrationInfo
  status: IntegrationStatusInfo
}

/**
 * Static registry of available integrations
 */
export const INTEGRATION_REGISTRY: Record<IntegrationType, IntegrationInfo> = {
  smtp: {
    type: 'smtp',
    name: 'Email (SMTP)',
    description: 'Send transactional emails via SMTP',
    icon: 'mail',
    configPath: '/admin/settings'
  },
  stripe: {
    type: 'stripe',
    name: 'Stripe',
    description: 'Accept payments for tickets',
    icon: 'credit-card',
    configPath: '/admin/settings/stripe'
  },
  helloasso: {
    type: 'helloasso',
    name: 'HelloAsso',
    description: 'Accept payments via HelloAsso (associations)',
    icon: 'heart-handshake',
    configPath: '/admin/settings/helloasso'
  },
  slack: {
    type: 'slack',
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: 'message-square',
    configPath: '/admin/settings/slack'
  },
  discord: {
    type: 'discord',
    name: 'Discord',
    description: 'Send notifications to Discord servers',
    icon: 'message-circle',
    configPath: '/admin/settings/discord'
  },
  webhooks: {
    type: 'webhooks',
    name: 'Webhooks',
    description: 'Send event notifications to external services',
    icon: 'webhook',
    configPath: '/admin/settings/webhooks'
  }
}

/**
 * Status labels for display
 */
export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  not_configured: 'Not configured',
  error: 'Error'
}

/**
 * Status colors for display
 */
export const INTEGRATION_STATUS_COLORS: Record<IntegrationStatus, string> = {
  connected: 'green',
  not_configured: 'yellow',
  error: 'red'
}

/**
 * Get all integration types
 */
export function getIntegrationTypes(): IntegrationType[] {
  return Object.keys(INTEGRATION_REGISTRY) as IntegrationType[]
}

/**
 * Get integration info by type
 */
export function getIntegrationInfo(type: IntegrationType): IntegrationInfo {
  return INTEGRATION_REGISTRY[type]
}

/**
 * Check if a type is a valid integration type
 */
export function isValidIntegrationType(type: string): type is IntegrationType {
  return type in INTEGRATION_REGISTRY
}

/**
 * Build integration entry from info and status
 */
export function buildIntegrationEntry(
  type: IntegrationType,
  status: IntegrationStatus,
  message?: string,
  details?: Record<string, unknown>
): IntegrationEntry {
  return {
    info: getIntegrationInfo(type),
    status: {
      type,
      status,
      message,
      lastChecked: new Date(),
      details
    }
  }
}

/**
 * Sort integrations by status priority (errors first, then not configured, then connected)
 */
export function sortIntegrationsByStatus(entries: IntegrationEntry[]): IntegrationEntry[] {
  const priority: Record<IntegrationStatus, number> = {
    error: 0,
    not_configured: 1,
    connected: 2
  }

  return [...entries].sort((a, b) => priority[a.status.status] - priority[b.status.status])
}

/**
 * Count integrations by status
 */
export function countIntegrationsByStatus(
  entries: IntegrationEntry[]
): Record<IntegrationStatus, number> {
  return {
    connected: entries.filter((e) => e.status.status === 'connected').length,
    not_configured: entries.filter((e) => e.status.status === 'not_configured').length,
    error: entries.filter((e) => e.status.status === 'error').length
  }
}

/**
 * Check if all required integrations are configured
 */
export function areRequiredIntegrationsConfigured(
  entries: IntegrationEntry[],
  required: IntegrationType[]
): boolean {
  return required.every((type) => {
    const entry = entries.find((e) => e.info.type === type)
    return entry?.status.status === 'connected'
  })
}
