import type PocketBase from 'pocketbase'
import {
  getSlackSettings,
  getSmtpSettings,
  getStripeSettings,
  isSlackConfigured,
  isStripeConfigured
} from './app-settings'
import {
  type IntegrationEntry,
  type IntegrationType,
  buildIntegrationEntry,
  getIntegrationTypes
} from './integration-registry'

/**
 * Check SMTP integration status
 */
async function checkSmtpStatus(pb: PocketBase): Promise<IntegrationEntry> {
  try {
    const settings = await getSmtpSettings(pb)

    if (!settings.smtpEnabled) {
      return buildIntegrationEntry('smtp', 'not_configured', 'SMTP is disabled')
    }

    if (!settings.smtpHost) {
      return buildIntegrationEntry('smtp', 'not_configured', 'SMTP host not configured')
    }

    return buildIntegrationEntry('smtp', 'connected', `Connected to ${settings.smtpHost}`, {
      host: settings.smtpHost,
      port: settings.smtpPort
    })
  } catch (error) {
    return buildIntegrationEntry(
      'smtp',
      'error',
      error instanceof Error ? error.message : 'Failed to check SMTP status'
    )
  }
}

/**
 * Check Stripe integration status
 */
async function checkStripeStatus(pb: PocketBase): Promise<IntegrationEntry> {
  try {
    const settings = await getStripeSettings(pb)

    if (!settings.stripeEnabled) {
      return buildIntegrationEntry('stripe', 'not_configured', 'Stripe is disabled')
    }

    if (!isStripeConfigured(settings)) {
      return buildIntegrationEntry('stripe', 'not_configured', 'Stripe keys not configured')
    }

    return buildIntegrationEntry('stripe', 'connected', `${settings.mode} mode`, {
      mode: settings.mode,
      isConfigured: settings.isConfigured
    })
  } catch (error) {
    return buildIntegrationEntry(
      'stripe',
      'error',
      error instanceof Error ? error.message : 'Failed to check Stripe status'
    )
  }
}

/**
 * Check Slack integration status
 */
async function checkSlackStatus(pb: PocketBase): Promise<IntegrationEntry> {
  try {
    const settings = await getSlackSettings(pb)

    if (!settings.slackEnabled) {
      return buildIntegrationEntry('slack', 'not_configured', 'Slack is disabled')
    }

    if (!isSlackConfigured(settings)) {
      return buildIntegrationEntry('slack', 'not_configured', 'Slack webhook not configured')
    }

    return buildIntegrationEntry('slack', 'connected', `Channel: ${settings.slackDefaultChannel}`, {
      channel: settings.slackDefaultChannel
    })
  } catch (error) {
    return buildIntegrationEntry(
      'slack',
      'error',
      error instanceof Error ? error.message : 'Failed to check Slack status'
    )
  }
}

/**
 * Check Discord integration status (placeholder for future implementation)
 */
async function checkDiscordStatus(_pb: PocketBase): Promise<IntegrationEntry> {
  // Discord integration not yet implemented
  return buildIntegrationEntry('discord', 'not_configured', 'Coming soon')
}

/**
 * Check Webhooks integration status
 */
async function checkWebhooksStatus(pb: PocketBase): Promise<IntegrationEntry> {
  try {
    const webhooks = await pb.collection('webhooks').getList(1, 1, {
      filter: 'isActive = true'
    })

    if (webhooks.totalItems === 0) {
      return buildIntegrationEntry('webhooks', 'not_configured', 'No active webhooks configured')
    }

    return buildIntegrationEntry(
      'webhooks',
      'connected',
      `${webhooks.totalItems} active webhook(s)`,
      {
        activeCount: webhooks.totalItems
      }
    )
  } catch {
    // Collection might not exist yet
    return buildIntegrationEntry('webhooks', 'not_configured', 'Webhooks not configured')
  }
}

/**
 * Check status of a specific integration
 */
export async function checkIntegrationStatus(
  pb: PocketBase,
  type: IntegrationType
): Promise<IntegrationEntry> {
  switch (type) {
    case 'smtp':
      return checkSmtpStatus(pb)
    case 'stripe':
      return checkStripeStatus(pb)
    case 'slack':
      return checkSlackStatus(pb)
    case 'discord':
      return checkDiscordStatus(pb)
    case 'webhooks':
      return checkWebhooksStatus(pb)
  }
}

/**
 * Get status of all integrations
 */
export async function getAllIntegrationStatuses(pb: PocketBase): Promise<IntegrationEntry[]> {
  const types = getIntegrationTypes()
  const entries: IntegrationEntry[] = []

  for (const type of types) {
    const entry = await checkIntegrationStatus(pb, type)
    entries.push(entry)
  }

  return entries
}

/**
 * Create integration service
 */
export function createIntegrationService(pb: PocketBase) {
  return {
    /**
     * Get status of all integrations
     */
    async getAll(): Promise<IntegrationEntry[]> {
      return getAllIntegrationStatuses(pb)
    },

    /**
     * Get status of a specific integration
     */
    async getStatus(type: IntegrationType): Promise<IntegrationEntry> {
      return checkIntegrationStatus(pb, type)
    },

    /**
     * Check if a specific integration is connected
     */
    async isConnected(type: IntegrationType): Promise<boolean> {
      const entry = await checkIntegrationStatus(pb, type)
      return entry.status.status === 'connected'
    }
  }
}
