/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Configure SMTP to use Mailpit in Docker network
    const settings = app.settings()

    if (!settings.smtp.host || settings.smtp.host === 'smtp.example.com') {
      settings.smtp.enabled = true
      settings.smtp.host = 'mailpit'
      settings.smtp.port = 1025
      settings.smtp.tls = false
      settings.smtp.authMethod = ''
      settings.smtp.username = ''
      settings.smtp.password = ''
      settings.smtp.localName = 'localhost'
    }

    if (!settings.meta.senderAddress || settings.meta.senderAddress === 'support@example.com') {
      settings.meta.senderName = 'Open Event Orchestrator'
      settings.meta.senderAddress = 'noreply@oeo.local'
    }

    if (!settings.meta.appURL || settings.meta.appURL === 'http://localhost:8090') {
      settings.meta.appURL = 'http://localhost:5173'
    }

    settings.meta.appName = 'Open Event Orchestrator'

    app.save(settings)

    // Update password reset email template to point to SvelteKit route
    try {
      const usersCollection = app.findCollectionByNameOrId('users')

      // In PB v0.36+, resetPasswordTemplate is a direct property on auth collections
      if (usersCollection.resetPasswordTemplate) {
        usersCollection.resetPasswordTemplate.body =
          '<p>Hello,</p>\n' +
          '<p>Click on the button below to reset your password.</p>\n' +
          '<p>\n' +
          '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
          '</p>\n' +
          "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
          '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
        app.save(usersCollection)
      } else if (usersCollection.options?.resetPasswordTemplate) {
        usersCollection.options.resetPasswordTemplate.body =
          '<p>Hello,</p>\n' +
          '<p>Click on the button below to reset your password.</p>\n' +
          '<p>\n' +
          '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
          '</p>\n' +
          "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
          '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
        app.save(usersCollection)
      }
    } catch (e) {
      console.log('[Migration 0028] Could not update reset template:', e)
    }
  },
  (app) => {
    // No rollback needed
  }
)
