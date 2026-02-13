import { getDiscordSettings, saveDiscordSettings } from '$lib/server/app-settings'
import { isValidWebhookUrl } from '$lib/server/discord-service'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const settings = await getDiscordSettings(locals.pb)

  return {
    discord: {
      hasWebhookUrl: !!settings.discordWebhookUrl,
      webhookUrlMasked: settings.discordWebhookUrl
        ? maskWebhookUrl(settings.discordWebhookUrl)
        : '',
      discordEnabled: settings.discordEnabled,
      discordUsername: settings.discordUsername,
      isConfigured: !!(settings.discordEnabled && settings.discordWebhookUrl)
    }
  }
}

/**
 * Mask webhook URL for display (show only last part)
 */
function maskWebhookUrl(url: string): string {
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

export const actions: Actions = {
  save: async ({ request, locals }) => {
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
      if (!isValidWebhookUrl(discordWebhookUrl)) {
        return fail(400, {
          error: 'Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/'
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
      return { success: true, action: 'save' }
    } catch (err) {
      console.error('Failed to save Discord settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  test: async ({ locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    // Get stored settings
    const settings = await getDiscordSettings(locals.pb)

    if (!settings.discordWebhookUrl) {
      return fail(400, { error: 'Webhook URL is required to test connection', action: 'test' })
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
        return fail(400, { error: `Discord API error: ${errorText}`, action: 'test' })
      }

      return {
        success: true,
        action: 'test',
        message: 'Test message sent successfully! Check your Discord channel.'
      }
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Connection failed',
        action: 'test'
      })
    }
  }
}
