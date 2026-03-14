/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Create user_totp_secrets collection
    const totpSecrets = new Collection()
    totpSecrets.name = 'user_totp_secrets'
    totpSecrets.type = 'base'
    totpSecrets.listRule = 'userId = @request.auth.id'
    totpSecrets.viewRule = 'userId = @request.auth.id'
    totpSecrets.createRule = '@request.auth.id != ""'
    totpSecrets.updateRule = 'userId = @request.auth.id'
    totpSecrets.deleteRule = 'userId = @request.auth.id'
    totpSecrets.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'userId', required: true },
        { type: 'text', name: 'secret', required: true },
        { type: 'bool', name: 'enabled', required: false },
        { type: 'json', name: 'backupCodes', required: false, maxSize: 2000000 },
        { type: 'date', name: 'enabledAt', required: false }
      ])
    )
    app.save(totpSecrets)

    // Create trusted_devices collection
    const trustedDevices = new Collection()
    trustedDevices.name = 'trusted_devices'
    trustedDevices.type = 'base'
    trustedDevices.listRule = 'userId = @request.auth.id'
    trustedDevices.viewRule = 'userId = @request.auth.id'
    trustedDevices.createRule = '@request.auth.id != ""'
    trustedDevices.updateRule = 'userId = @request.auth.id'
    trustedDevices.deleteRule = 'userId = @request.auth.id'
    trustedDevices.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'userId', required: true },
        { type: 'text', name: 'deviceHash', required: true },
        { type: 'date', name: 'expiresAt', required: true }
      ])
    )
    app.save(trustedDevices)
  },
  (app) => {
    try {
      const totpCollection = app.findCollectionByNameOrId('user_totp_secrets')
      app.delete(totpCollection)
    } catch {}
    try {
      const trustedCollection = app.findCollectionByNameOrId('trusted_devices')
      app.delete(trustedCollection)
    } catch {}
  }
)
