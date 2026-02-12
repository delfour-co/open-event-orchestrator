import { env } from '$env/dynamic/private'
import { createConsoleEmailService, createSmtpEmailService } from '$lib/features/cfp/services'
import type { EmailService } from '$lib/features/cfp/services'
import type PocketBase from 'pocketbase'

// =============================================================================
// SMTP Settings
// =============================================================================

export interface SmtpSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  smtpEnabled: boolean
}

const DEFAULT_SMTP: SmtpSettings = {
  smtpHost: 'localhost',
  smtpPort: 1025,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: 'noreply@open-event-orchestrator.local',
  smtpEnabled: true
}

export async function getSmtpSettings(pb: PocketBase): Promise<SmtpSettings> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) {
      return DEFAULT_SMTP
    }
    const record = records.items[0]
    return {
      smtpHost: (record.smtpHost as string) || DEFAULT_SMTP.smtpHost,
      smtpPort: (record.smtpPort as number) || DEFAULT_SMTP.smtpPort,
      smtpUser: (record.smtpUser as string) || '',
      smtpPass: (record.smtpPass as string) || '',
      smtpFrom: (record.smtpFrom as string) || DEFAULT_SMTP.smtpFrom,
      smtpEnabled: record.smtpEnabled !== false
    }
  } catch {
    return DEFAULT_SMTP
  }
}

export async function saveSmtpSettings(pb: PocketBase, settings: SmtpSettings): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data = {
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom,
    smtpEnabled: settings.smtpEnabled
  }

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}

export async function getEmailService(pb: PocketBase): Promise<EmailService> {
  const settings = await getSmtpSettings(pb)

  if (!settings.smtpEnabled || !settings.smtpHost) {
    return createConsoleEmailService()
  }

  return createSmtpEmailService({
    host: settings.smtpHost,
    port: settings.smtpPort,
    user: settings.smtpUser || undefined,
    pass: settings.smtpPass || undefined,
    from: settings.smtpFrom
  })
}

// =============================================================================
// Stripe Settings
// =============================================================================

export type StripeMode = 'test' | 'live'

export interface StripeSettings {
  stripeSecretKey: string
  stripePublishableKey: string
  stripeWebhookSecret: string
  stripeEnabled: boolean
}

export interface StripeSettingsInfo extends StripeSettings {
  mode: StripeMode
  isConfigured: boolean
}

const DEFAULT_STRIPE: StripeSettings = {
  stripeSecretKey: '',
  stripePublishableKey: '',
  stripeWebhookSecret: '',
  stripeEnabled: false
}

/**
 * Determine Stripe mode from secret key prefix
 */
export function getStripeMode(secretKey: string): StripeMode {
  if (secretKey.startsWith('sk_live_')) {
    return 'live'
  }
  return 'test'
}

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(settings: StripeSettings): boolean {
  return !!(
    settings.stripeEnabled &&
    settings.stripeSecretKey &&
    settings.stripePublishableKey &&
    settings.stripeWebhookSecret
  )
}

/**
 * Mask sensitive key for display (show only last 4 characters)
 */
export function maskStripeKey(key: string): string {
  if (!key || key.length < 8) {
    return '••••••••'
  }
  const prefix = key.startsWith('sk_') || key.startsWith('pk_') ? key.slice(0, 8) : ''
  const suffix = key.slice(-4)
  return `${prefix}••••••••${suffix}`
}

/**
 * Get Stripe settings from database, with fallback to environment variables
 */
export async function getStripeSettings(pb: PocketBase): Promise<StripeSettingsInfo> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)

    if (records.items.length > 0) {
      const record = records.items[0]
      const secretKey = (record.stripeSecretKey as string) || ''

      // If DB has settings, use them
      if (secretKey) {
        const settings: StripeSettings = {
          stripeSecretKey: secretKey,
          stripePublishableKey: (record.stripePublishableKey as string) || '',
          stripeWebhookSecret: (record.stripeWebhookSecret as string) || '',
          stripeEnabled: record.stripeEnabled === true
        }

        return {
          ...settings,
          mode: getStripeMode(secretKey),
          isConfigured: isStripeConfigured(settings)
        }
      }
    }

    // Fallback to environment variables
    const envSecretKey = env.STRIPE_SECRET_KEY || ''
    const envSettings: StripeSettings = {
      stripeSecretKey: envSecretKey,
      stripePublishableKey: env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
      stripeEnabled: !!envSecretKey
    }

    return {
      ...envSettings,
      mode: getStripeMode(envSecretKey),
      isConfigured: isStripeConfigured(envSettings)
    }
  } catch {
    // If collection doesn't exist or error, try env vars
    const envSecretKey = env.STRIPE_SECRET_KEY || ''
    return {
      ...DEFAULT_STRIPE,
      stripeSecretKey: envSecretKey,
      stripePublishableKey: env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
      stripeEnabled: !!envSecretKey,
      mode: getStripeMode(envSecretKey),
      isConfigured: false
    }
  }
}

/**
 * Save Stripe settings to database
 */
export async function saveStripeSettings(
  pb: PocketBase,
  settings: Partial<StripeSettings>
): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data: Record<string, unknown> = {}

  if (settings.stripeSecretKey !== undefined) {
    data.stripeSecretKey = settings.stripeSecretKey
  }
  if (settings.stripePublishableKey !== undefined) {
    data.stripePublishableKey = settings.stripePublishableKey
  }
  if (settings.stripeWebhookSecret !== undefined) {
    data.stripeWebhookSecret = settings.stripeWebhookSecret
  }
  if (settings.stripeEnabled !== undefined) {
    data.stripeEnabled = settings.stripeEnabled
  }

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}

/**
 * Test Stripe connection by making a simple API call
 */
export async function testStripeConnection(
  secretKey: string
): Promise<{ success: boolean; message: string; accountId?: string }> {
  if (!secretKey) {
    return { success: false, message: 'Secret key is required' }
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    return { success: false, message: 'Invalid secret key format' }
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        message: error.error?.message || `HTTP ${response.status}`
      }
    }

    const account = await response.json()
    return {
      success: true,
      message: `Connected to ${account.business_profile?.name || account.email || 'Stripe account'}`,
      accountId: account.id
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// =============================================================================
// Slack Settings
// =============================================================================

export interface SlackSettings {
  slackWebhookUrl: string
  slackEnabled: boolean
  slackDefaultChannel: string
}

const DEFAULT_SLACK: SlackSettings = {
  slackWebhookUrl: '',
  slackEnabled: false,
  slackDefaultChannel: '#general'
}

/**
 * Check if Slack is properly configured
 */
export function isSlackConfigured(settings: SlackSettings): boolean {
  return !!(settings.slackEnabled && settings.slackWebhookUrl)
}

/**
 * Get Slack settings from database
 */
export async function getSlackSettings(pb: PocketBase): Promise<SlackSettings> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) {
      return DEFAULT_SLACK
    }
    const record = records.items[0]
    return {
      slackWebhookUrl: (record.slackWebhookUrl as string) || '',
      slackEnabled: record.slackEnabled === true,
      slackDefaultChannel:
        (record.slackDefaultChannel as string) || DEFAULT_SLACK.slackDefaultChannel
    }
  } catch {
    return DEFAULT_SLACK
  }
}

/**
 * Save Slack settings to database
 */
export async function saveSlackSettings(
  pb: PocketBase,
  settings: Partial<SlackSettings>
): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data: Record<string, unknown> = {}

  if (settings.slackWebhookUrl !== undefined) {
    data.slackWebhookUrl = settings.slackWebhookUrl
  }
  if (settings.slackEnabled !== undefined) {
    data.slackEnabled = settings.slackEnabled
  }
  if (settings.slackDefaultChannel !== undefined) {
    data.slackDefaultChannel = settings.slackDefaultChannel
  }

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}
