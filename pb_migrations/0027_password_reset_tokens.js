/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection()
    collection.name = 'password_reset_tokens'
    collection.type = 'base'
    collection.listRule = ''
    collection.viewRule = ''
    collection.createRule = ''
    collection.updateRule = ''
    collection.deleteRule = ''
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'userId', required: true },
        { type: 'text', name: 'token', required: true },
        { type: 'date', name: 'expiresAt', required: true },
        { type: 'bool', name: 'used', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('password_reset_tokens')
      app.delete(collection)
    } catch {}
  }
)
