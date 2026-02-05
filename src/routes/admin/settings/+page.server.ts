import { getEmailService, getSmtpSettings, saveSmtpSettings } from '$lib/server/app-settings'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const smtp = await getSmtpSettings(locals.pb)

  return {
    smtp: {
      smtpHost: smtp.smtpHost,
      smtpPort: smtp.smtpPort,
      smtpUser: smtp.smtpUser,
      smtpFrom: smtp.smtpFrom,
      smtpEnabled: smtp.smtpEnabled,
      hasPassword: !!smtp.smtpPass
    }
  }
}

export const actions: Actions = {
  saveSmtp: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const smtpHost = (formData.get('smtpHost') as string)?.trim() || ''
    const smtpPort = Number.parseInt(formData.get('smtpPort') as string, 10) || 1025
    const smtpUser = (formData.get('smtpUser') as string)?.trim() || ''
    const smtpPass = (formData.get('smtpPass') as string) || ''
    const smtpFrom = (formData.get('smtpFrom') as string)?.trim() || ''
    const smtpEnabled = formData.get('smtpEnabled') === 'true'

    if (!smtpHost) {
      return fail(400, { error: 'SMTP host is required' })
    }

    if (!smtpFrom) {
      return fail(400, { error: 'From address is required' })
    }

    if (smtpPort < 1 || smtpPort > 65535) {
      return fail(400, { error: 'Port must be between 1 and 65535' })
    }

    // If password field is empty, keep the existing one
    let finalPass = smtpPass
    if (!smtpPass) {
      const existing = await getSmtpSettings(locals.pb)
      finalPass = existing.smtpPass
    }

    try {
      await saveSmtpSettings(locals.pb, {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass: finalPass,
        smtpFrom,
        smtpEnabled
      })

      return { success: true, action: 'saveSmtp' }
    } catch (err) {
      console.error('Failed to save SMTP settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  testEmail: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const testTo = (formData.get('testTo') as string)?.trim()

    if (!testTo) {
      return fail(400, { error: 'Email address is required' })
    }

    try {
      const emailService = await getEmailService(locals.pb)

      const result = await emailService.send({
        to: testTo,
        subject: 'Test Email - Open Event Orchestrator',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">SMTP Configuration Test</h1>
  <p>This is a test email from Open Event Orchestrator.</p>
  <p>If you received this email, your SMTP configuration is working correctly.</p>
  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    Sent at ${new Date().toISOString()}
  </p>
</body>
</html>`,
        text: `SMTP Configuration Test\n\nThis is a test email from Open Event Orchestrator.\nIf you received this email, your SMTP configuration is working correctly.\n\nSent at ${new Date().toISOString()}`
      })

      if (result.success) {
        return { success: true, action: 'testEmail' }
      }

      return fail(500, { error: result.error || 'Failed to send test email' })
    } catch (err) {
      console.error('Failed to send test email:', err)
      return fail(500, { error: 'Failed to send test email' })
    }
  }
}
