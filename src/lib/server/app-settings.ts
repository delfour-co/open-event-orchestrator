import { env } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
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
  stripeApiBase: string
}

export interface StripeSettingsInfo extends StripeSettings {
  mode: StripeMode
  isConfigured: boolean
  isLocalMock: boolean
}

const DEFAULT_STRIPE: StripeSettings = {
  stripeSecretKey: '',
  stripePublishableKey: '',
  stripeWebhookSecret: '',
  stripeEnabled: false,
  stripeApiBase: ''
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
  return !!(settings.stripeEnabled && settings.stripeSecretKey && settings.stripePublishableKey)
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
          stripeEnabled: record.stripeEnabled === true,
          stripeApiBase: (record.stripeApiBase as string) || env.STRIPE_API_BASE || ''
        }

        return {
          ...settings,
          mode: getStripeMode(secretKey),
          isConfigured: isStripeConfigured(settings),
          isLocalMock: isLocalMock(settings.stripeApiBase)
        }
      }
    }

    // Fallback to environment variables, then defaults
    const envSecretKey = env.STRIPE_SECRET_KEY || DEFAULT_STRIPE.stripeSecretKey
    const envSettings: StripeSettings = {
      stripeSecretKey: envSecretKey,
      stripePublishableKey:
        publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE.stripePublishableKey,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || DEFAULT_STRIPE.stripeWebhookSecret,
      stripeEnabled: !!envSecretKey,
      stripeApiBase: env.STRIPE_API_BASE || DEFAULT_STRIPE.stripeApiBase
    }

    return {
      ...envSettings,
      mode: getStripeMode(envSecretKey),
      isConfigured: isStripeConfigured(envSettings),
      isLocalMock: isLocalMock(envSettings.stripeApiBase)
    }
  } catch {
    // If collection doesn't exist or error, try env vars then defaults
    const envSecretKey = env.STRIPE_SECRET_KEY || DEFAULT_STRIPE.stripeSecretKey
    const fallback: StripeSettings = {
      ...DEFAULT_STRIPE,
      stripeSecretKey: envSecretKey,
      stripePublishableKey:
        publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE.stripePublishableKey,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || DEFAULT_STRIPE.stripeWebhookSecret,
      stripeEnabled: !!envSecretKey,
      stripeApiBase: env.STRIPE_API_BASE || DEFAULT_STRIPE.stripeApiBase
    }
    return {
      ...fallback,
      mode: getStripeMode(envSecretKey),
      isConfigured: isStripeConfigured(fallback),
      isLocalMock: isLocalMock(fallback.stripeApiBase)
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
/**
 * Check if the API base points to a local mock server (e.g. LocalStripe)
 */
function isLocalMock(apiBase?: string): boolean {
  if (!apiBase) return false
  try {
    const url = new URL(apiBase)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export async function testStripeConnection(
  secretKey: string,
  apiBase?: string
): Promise<{ success: boolean; message: string; accountId?: string }> {
  if (!secretKey) {
    return { success: false, message: 'Secret key is required' }
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    return { success: false, message: 'Invalid secret key format' }
  }

  const baseUrl = apiBase || 'https://api.stripe.com'

  // For local mock servers (e.g. LocalStripe), just check reachability
  // since they don't support /v1/account
  if (isLocalMock(apiBase)) {
    try {
      const response = await fetch(`${baseUrl}/v1/customers`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      })
      if (response.ok || response.status === 401) {
        return {
          success: true,
          message: `Connected to local mock (${apiBase})`
        }
      }
      return {
        success: false,
        message: `Local mock server unreachable (HTTP ${response.status})`
      }
    } catch (error) {
      return {
        success: false,
        message: `Local mock server unreachable: ${error instanceof Error ? error.message : 'Connection failed'}`
      }
    }
  }

  try {
    const response = await fetch(`${baseUrl}/v1/account`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const text = await response.text()
    let data: Record<string, unknown>
    try {
      data = JSON.parse(text)
    } catch {
      return {
        success: false,
        message: `Invalid response from Stripe API (HTTP ${response.status})`
      }
    }

    if (!response.ok) {
      const err = data.error as Record<string, unknown> | undefined
      return {
        success: false,
        message: (err?.message as string) || `HTTP ${response.status}`
      }
    }

    return {
      success: true,
      message: `Connected to ${(data.business_profile as Record<string, unknown>)?.name || data.email || 'Stripe account'}`,
      accountId: data.id as string
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

// =============================================================================
// Discord Settings
// =============================================================================

export interface DiscordSettings {
  discordWebhookUrl: string
  discordEnabled: boolean
  discordUsername: string
}

const DEFAULT_DISCORD: DiscordSettings = {
  discordWebhookUrl: '',
  discordEnabled: false,
  discordUsername: 'Open Event Orchestrator'
}

/**
 * Check if Discord is properly configured
 */
export function isDiscordConfigured(settings: DiscordSettings): boolean {
  return !!(settings.discordEnabled && settings.discordWebhookUrl)
}

/**
 * Get Discord settings from database
 */
export async function getDiscordSettings(pb: PocketBase): Promise<DiscordSettings> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) {
      return DEFAULT_DISCORD
    }
    const record = records.items[0]
    return {
      discordWebhookUrl: (record.discordWebhookUrl as string) || '',
      discordEnabled: record.discordEnabled === true,
      discordUsername: (record.discordUsername as string) || DEFAULT_DISCORD.discordUsername
    }
  } catch {
    return DEFAULT_DISCORD
  }
}

/**
 * Save Discord settings to database
 */
export async function saveDiscordSettings(
  pb: PocketBase,
  settings: Partial<DiscordSettings>
): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data: Record<string, unknown> = {}

  if (settings.discordWebhookUrl !== undefined) {
    data.discordWebhookUrl = settings.discordWebhookUrl
  }
  if (settings.discordEnabled !== undefined) {
    data.discordEnabled = settings.discordEnabled
  }
  if (settings.discordUsername !== undefined) {
    data.discordUsername = settings.discordUsername
  }

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}

// =============================================================================
// HelloAsso Settings
// =============================================================================

const HELLOASSO_API_BASE = 'https://api.helloasso.com'
const HELLOASSO_SANDBOX_API_BASE = 'https://api.helloasso-sandbox.com'

export interface HelloAssoSettings {
  helloassoClientId: string
  helloassoClientSecret: string
  helloassoOrgSlug: string
  helloassoEnabled: boolean
  helloassoSandbox: boolean
  helloassoApiBase: string
}

const DEFAULT_HELLOASSO: HelloAssoSettings = {
  helloassoClientId: '',
  helloassoClientSecret: '',
  helloassoOrgSlug: '',
  helloassoEnabled: false,
  helloassoSandbox: true,
  helloassoApiBase: HELLOASSO_SANDBOX_API_BASE
}

export function isHelloAssoConfigured(settings: HelloAssoSettings): boolean {
  return !!(
    settings.helloassoEnabled &&
    settings.helloassoClientId &&
    settings.helloassoClientSecret &&
    settings.helloassoOrgSlug
  )
}

export async function getHelloAssoSettings(pb: PocketBase): Promise<HelloAssoSettings> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length === 0) {
      return DEFAULT_HELLOASSO
    }
    const record = records.items[0]
    const sandbox = record.helloassoSandbox !== false
    return {
      helloassoClientId: (record.helloassoClientId as string) || '',
      helloassoClientSecret: (record.helloassoClientSecret as string) || '',
      helloassoOrgSlug: (record.helloassoOrgSlug as string) || '',
      helloassoEnabled: record.helloassoEnabled === true,
      helloassoSandbox: sandbox,
      helloassoApiBase: sandbox ? HELLOASSO_SANDBOX_API_BASE : HELLOASSO_API_BASE
    }
  } catch {
    return DEFAULT_HELLOASSO
  }
}

export async function saveHelloAssoSettings(
  pb: PocketBase,
  settings: Partial<HelloAssoSettings>
): Promise<void> {
  const records = await pb.collection('app_settings').getList(1, 1)
  const data: Record<string, unknown> = {}

  if (settings.helloassoClientId !== undefined) data.helloassoClientId = settings.helloassoClientId
  if (settings.helloassoClientSecret !== undefined)
    data.helloassoClientSecret = settings.helloassoClientSecret
  if (settings.helloassoOrgSlug !== undefined) data.helloassoOrgSlug = settings.helloassoOrgSlug
  if (settings.helloassoEnabled !== undefined) data.helloassoEnabled = settings.helloassoEnabled
  if (settings.helloassoSandbox !== undefined) data.helloassoSandbox = settings.helloassoSandbox

  if (records.items.length > 0) {
    await pb.collection('app_settings').update(records.items[0].id, data)
  } else {
    await pb.collection('app_settings').create(data)
  }
}

export async function testHelloAssoConnection(
  clientId: string,
  clientSecret: string,
  orgSlug: string,
  sandbox: boolean
): Promise<{ success: boolean; message: string }> {
  if (!clientId || !clientSecret || !orgSlug) {
    return {
      success: false,
      message: 'Client ID, Client Secret, and Organization Slug are required'
    }
  }

  const apiBase = sandbox ? HELLOASSO_SANDBOX_API_BASE : HELLOASSO_API_BASE

  try {
    const response = await fetch(`${apiBase}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString()
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, message: `Authentication failed (${response.status}): ${text}` }
    }

    return {
      success: true,
      message: `Connected to HelloAsso${sandbox ? ' (sandbox)' : ''} for organization "${orgSlug}"`
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}
