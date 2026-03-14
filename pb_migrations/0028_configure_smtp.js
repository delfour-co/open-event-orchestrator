/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const settings = app.settings()

    // Configure SMTP to use Mailpit (or any local SMTP in Docker network)
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

    // Set sender info if not configured
    if (!settings.meta.senderAddress || settings.meta.senderAddress === 'support@example.com') {
      settings.meta.senderName = 'Open Event Orchestrator'
      settings.meta.senderAddress = 'noreply@oeo.local'
    }

    // Set app URL to SvelteKit dev server
    if (!settings.meta.appURL || settings.meta.appURL === 'http://localhost:8090') {
      settings.meta.appURL = 'http://localhost:5173'
    }

    app.save(settings)

    // Customize the password reset email template to point to our SvelteKit route
    const usersCollection = app.findCollectionByNameOrId('users')
    const options = usersCollection.options || {}

    if (options.resetPasswordTemplate) {
      options.resetPasswordTemplate.body =
        '<p>Hello,</p>\n' +
        '<p>Click on the button below to reset your password.</p>\n' +
        '<p>\n' +
        '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
        '</p>\n' +
        "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
        '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
    }

    if (options.verificationTemplate) {
      options.verificationTemplate.body =
        '<p>Hello,</p>\n' +
        '<p>Thank you for joining {APP_NAME}.</p>\n' +
        '<p>Click on the button below to verify your email address.</p>\n' +
        '<p>\n' +
        '  <a class="btn" href="{APP_URL}/auth/verify-email/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n' +
        '</p>\n' +
        "<p>If you didn't ask to verify your email, you can ignore this email.</p>\n" +
        '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
    }

    usersCollection.options = options
    app.save(usersCollection)
  },
  (app) => {
    // No rollback needed — settings can be manually reconfigured
  }
)
