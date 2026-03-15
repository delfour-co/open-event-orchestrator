import {
  getDiscordSettings,
  getSlackSettings,
  saveDiscordSettings,
  saveSlackSettings
} from '$lib/server/app-settings'
import { isValidWebhookUrl as isValidDiscordWebhookUrl } from '$lib/server/discord-service'
import { canAccessSettings } from '$lib/server/permissions'
import { isValidWebhookUrl as isValidSlackWebhookUrl } from '$lib/server/slack-service'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

/**
 * Mask Slack webhook URL for display (show only last part)
 */
function maskSlackWebhookUrl(url: string): string {
  if (!url) {
    return ''
  }
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/')
    if (parts.length >= 4) {
      return `https://hooks.slack.com/services/****/${parts[parts.length - 1].slice(0, 8)}...`
    }
    return 'https://hooks.slack.com/services/****'
  } catch {
    return '****'
  }
}

/**
 * Mask Discord webhook URL for display (show only last part)
 */
function maskDiscordWebhookUrl(url: string): string {
  if (!url) {
    return ''
  }
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/')
    if (parts.length >= 4) {
      return `https://discord.com/api/webhooks/****/${parts[parts.length - 1].slice(0, 8)}...`
    }
    return 'https://discord.com/api/webhooks/****'
  } catch {
    return '****'
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const [slackSettings, discordSettings] = await Promise.all([
    getSlackSettings(locals.pb),
    getDiscordSettings(locals.pb)
  ])

  return {
    slack: {
      hasWebhookUrl: !!slackSettings.slackWebhookUrl,
      webhookUrlMasked: slackSettings.slackWebhookUrl
        ? maskSlackWebhookUrl(slackSettings.slackWebhookUrl)
        : '',
      slackEnabled: slackSettings.slackEnabled,
      slackDefaultChannel: slackSettings.slackDefaultChannel,
      isConfigured: !!(slackSettings.slackEnabled && slackSettings.slackWebhookUrl)
    },
    discord: {
      hasWebhookUrl: !!discordSettings.discordWebhookUrl,
      webhookUrlMasked: discordSettings.discordWebhookUrl
        ? maskDiscordWebhookUrl(discordSettings.discordWebhookUrl)
        : '',
      discordEnabled: discordSettings.discordEnabled,
      discordUsername: discordSettings.discordUsername,
      isConfigured: !!(discordSettings.discordEnabled && discordSettings.discordWebhookUrl)
    }
  }
}

export const actions: Actions = {
  saveSlack: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const slackWebhookUrl = (formData.get('slackWebhookUrl') as string)?.trim() || ''
    const slackEnabled = formData.get('slackEnabled') === 'true'
    const slackDefaultChannel =
      (formData.get('slackDefaultChannel') as string)?.trim() || '#general'

    // Prepare settings
    const settings: {
      slackWebhookUrl?: string
      slackEnabled: boolean
      slackDefaultChannel?: string
    } = {
      slackEnabled
    }

    // Only update webhook URL if provided (non-empty)
    if (slackWebhookUrl) {
      // Validate webhook URL format
      if (!isValidSlackWebhookUrl(slackWebhookUrl)) {
        return fail(400, {
          error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/',
          provider: 'slack'
        })
      }
      settings.slackWebhookUrl = slackWebhookUrl
    }

    // Update channel if provided
    if (slackDefaultChannel) {
      settings.slackDefaultChannel = slackDefaultChannel
    }

    try {
      await saveSlackSettings(locals.pb, settings)
      return { success: true, action: 'save', provider: 'slack' }
    } catch (err) {
      console.error('Failed to save Slack settings:', err)
      return fail(500, { error: 'Failed to save settings', provider: 'slack' })
    }
  },

  testSlack: async ({ locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    // Get stored settings
    const settings = await getSlackSettings(locals.pb)

    if (!settings.slackWebhookUrl) {
      return fail(400, {
        error: 'Webhook URL is required to test connection',
        action: 'test',
        provider: 'slack'
      })
    }

    try {
      const response = await fetch(settings.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: ':bell: Test notification from Open Event Orchestrator',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: ':bell: Test Notification',
                emoji: true
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'This is a test message from Open Event Orchestrator.\n\nIf you see this message, your Slack integration is working correctly! :tada:'
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Sent at ${new Date().toISOString()}`
                }
              ]
            }
          ],
          channel: settings.slackDefaultChannel
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return fail(400, {
          error: `Slack API error: ${errorText}`,
          action: 'test',
          provider: 'slack'
        })
      }

      return {
        success: true,
        action: 'test',
        provider: 'slack',
        message: 'Test message sent successfully! Check your Slack channel.'
      }
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Connection failed',
        action: 'test',
        provider: 'slack'
      })
    }
  },

  saveDiscord: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const discordWebhookUrl = (formData.get('discordWebhookUrl') as string)?.trim() || ''
    const discordEnabled = formData.get('discordEnabled') === 'true'
    const discordUsername = (formData.get('discordUsername') as string)?.trim() || ''

    // Prepare settings
    const settings: {
      discordWebhookUrl?: string
      discordEnabled: boolean
      discordUsername?: string
    } = {
      discordEnabled
    }

    // Only update webhook URL if provided (non-empty)
    if (discordWebhookUrl) {
      // Validate webhook URL format
      if (!isValidDiscordWebhookUrl(discordWebhookUrl)) {
        return fail(400, {
          error: 'Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/',
          provider: 'discord'
        })
      }
      settings.discordWebhookUrl = discordWebhookUrl
    }

    // Update username if provided
    if (discordUsername) {
      settings.discordUsername = discordUsername
    }

    try {
      await saveDiscordSettings(locals.pb, settings)
      return { success: true, action: 'save', provider: 'discord' }
    } catch (err) {
      console.error('Failed to save Discord settings:', err)
      return fail(500, { error: 'Failed to save settings', provider: 'discord' })
    }
  },

  testDiscord: async ({ locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    // Get stored settings
    const settings = await getDiscordSettings(locals.pb)

    if (!settings.discordWebhookUrl) {
      return fail(400, {
        error: 'Webhook URL is required to test connection',
        action: 'test',
        provider: 'discord'
      })
    }

    try {
      const response = await fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: ':bell: Test notification from Open Event Orchestrator',
          embeds: [
            {
              title: 'Test Notification',
              description:
                'This is a test message from Open Event Orchestrator.\n\nIf you see this message, your Discord integration is working correctly!',
              color: 3447003, // Blue color
              timestamp: new Date().toISOString()
            }
          ],
          username: settings.discordUsername || 'Open Event Orchestrator'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return fail(400, {
          error: `Discord API error: ${errorText}`,
          action: 'test',
          provider: 'discord'
        })
      }

      return {
        success: true,
        action: 'test',
        provider: 'discord',
        message: 'Test message sent successfully! Check your Discord channel.'
      }
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Connection failed',
        action: 'test',
        provider: 'discord'
      })
    }
  }
}
