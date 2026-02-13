import { getSlackSettings, saveSlackSettings } from '$lib/server/app-settings'
import { canAccessSettings } from '$lib/server/permissions'
import { isValidWebhookUrl } from '$lib/server/slack-service'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const settings = await getSlackSettings(locals.pb)

  return {
    slack: {
      hasWebhookUrl: !!settings.slackWebhookUrl,
      webhookUrlMasked: settings.slackWebhookUrl ? maskWebhookUrl(settings.slackWebhookUrl) : '',
      slackEnabled: settings.slackEnabled,
      slackDefaultChannel: settings.slackDefaultChannel,
      isConfigured: !!(settings.slackEnabled && settings.slackWebhookUrl)
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
      return `https://hooks.slack.com/services/****/${parts[parts.length - 1].slice(0, 8)}...`
    }
    return 'https://hooks.slack.com/services/****'
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
      if (!isValidWebhookUrl(slackWebhookUrl)) {
        return fail(400, {
          error: 'Invalid Slack webhook URL. Must start with https://hooks.slack.com/'
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
      return { success: true, action: 'save' }
    } catch (err) {
      console.error('Failed to save Slack settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  test: async ({ locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    // Get stored settings
    const settings = await getSlackSettings(locals.pb)

    if (!settings.slackWebhookUrl) {
      return fail(400, { error: 'Webhook URL is required to test connection', action: 'test' })
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
        return fail(400, { error: `Slack API error: ${errorText}`, action: 'test' })
      }

      return {
        success: true,
        action: 'test',
        message: 'Test message sent successfully! Check your Slack channel.'
      }
    } catch (err) {
      return fail(400, {
        error: err instanceof Error ? err.message : 'Connection failed',
        action: 'test'
      })
    }
  }
}
