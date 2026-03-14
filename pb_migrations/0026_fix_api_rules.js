/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Fix user_totp_secrets API rules
    try {
      const totpSecrets = app.findCollectionByNameOrId('user_totp_secrets')
      totpSecrets.listRule = 'userId = @request.auth.id'
      totpSecrets.viewRule = 'userId = @request.auth.id'
      totpSecrets.createRule = '@request.auth.id != ""'
      totpSecrets.updateRule = 'userId = @request.auth.id'
      totpSecrets.deleteRule = 'userId = @request.auth.id'
      app.save(totpSecrets)
    } catch {}

    // Fix trusted_devices API rules
    try {
      const trustedDevices = app.findCollectionByNameOrId('trusted_devices')
      trustedDevices.listRule = 'userId = @request.auth.id'
      trustedDevices.viewRule = 'userId = @request.auth.id'
      trustedDevices.createRule = '@request.auth.id != ""'
      trustedDevices.updateRule = 'userId = @request.auth.id'
      trustedDevices.deleteRule = 'userId = @request.auth.id'
      app.save(trustedDevices)
    } catch {}

    // Fix audit_logs API rules
    try {
      const auditLogs = app.findCollectionByNameOrId('audit_logs')
      auditLogs.listRule = '@request.auth.id != ""'
      auditLogs.viewRule = '@request.auth.id != ""'
      auditLogs.createRule = '@request.auth.id != ""'
      auditLogs.updateRule = ''
      auditLogs.deleteRule = ''
      app.save(auditLogs)
    } catch {}
  },
  (app) => {
    // Revert to superuser-only (default)
    try {
      const totpSecrets = app.findCollectionByNameOrId('user_totp_secrets')
      totpSecrets.listRule = null
      totpSecrets.viewRule = null
      totpSecrets.createRule = null
      totpSecrets.updateRule = null
      totpSecrets.deleteRule = null
      app.save(totpSecrets)
    } catch {}

    try {
      const trustedDevices = app.findCollectionByNameOrId('trusted_devices')
      trustedDevices.listRule = null
      trustedDevices.viewRule = null
      trustedDevices.createRule = null
      trustedDevices.updateRule = null
      trustedDevices.deleteRule = null
      app.save(trustedDevices)
    } catch {}

    try {
      const auditLogs = app.findCollectionByNameOrId('audit_logs')
      auditLogs.listRule = null
      auditLogs.viewRule = null
      auditLogs.createRule = null
      auditLogs.updateRule = null
      auditLogs.deleteRule = null
      app.save(auditLogs)
    } catch {}
  }
)
