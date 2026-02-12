/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // App Settings collection (singleton for global configuration)
    const appSettings = new Collection({
      name: 'app_settings',
      type: 'base',
      fields: [
        // SMTP Settings
        { name: 'smtpHost', type: 'text', options: { max: 255 } },
        { name: 'smtpPort', type: 'number', options: { min: 1, max: 65535 } },
        { name: 'smtpUser', type: 'text', options: { max: 255 } },
        { name: 'smtpPass', type: 'text', options: { max: 255 } },
        { name: 'smtpFrom', type: 'email' },
        { name: 'smtpEnabled', type: 'bool' },

        // Stripe Settings
        { name: 'stripeSecretKey', type: 'text', options: { max: 255 } },
        { name: 'stripePublishableKey', type: 'text', options: { max: 255 } },
        { name: 'stripeWebhookSecret', type: 'text', options: { max: 255 } },
        { name: 'stripeEnabled', type: 'bool' },

        // Slack Settings
        { name: 'slackWebhookUrl', type: 'url' },
        { name: 'slackEnabled', type: 'bool' },
        { name: 'slackDefaultChannel', type: 'text', options: { max: 100 } },

        // Discord Settings (reserved for future)
        { name: 'discordWebhookUrl', type: 'url' },
        { name: 'discordEnabled', type: 'bool' }
      ]
    })
    app.save(appSettings)
  },
  (app) => {
    // Rollback
    const appSettings = app.findCollectionByNameOrId('app_settings')
    if (appSettings) {
      app.delete(appSettings)
    }
  }
)
