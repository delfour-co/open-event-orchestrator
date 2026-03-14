/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Fix app URL to point to SvelteKit dev server
    const settings = app.settings()
    settings.meta.appURL = 'http://localhost:5173'
    settings.meta.appName = 'Open Event Orchestrator'
    app.save(settings)

    // Fix password reset template to use our SvelteKit route
    const usersCollection = app.findCollectionByNameOrId('users')
    usersCollection.resetPasswordTemplate = {
      subject: 'Reset your {APP_NAME} password',
      body:
        '<p>Hello,</p>\n' +
        '<p>Click on the button below to reset your password.</p>\n' +
        '<p>\n' +
        '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
        '</p>\n' +
        "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
        '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
    }
    app.save(usersCollection)
  },
  (app) => {}
)
