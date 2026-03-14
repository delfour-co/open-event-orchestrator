/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection()
    collection.name = 'audit_logs'
    collection.type = 'base'
    collection.listRule = '@request.auth.id != ""'
    collection.viewRule = '@request.auth.id != ""'
    collection.createRule = '@request.auth.id != ""'
    collection.updateRule = ''
    collection.deleteRule = ''
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'organizationId', required: true },
        { type: 'text', name: 'userId', required: false },
        { type: 'text', name: 'userName', required: false },
        { type: 'text', name: 'action', required: true },
        { type: 'text', name: 'entityType', required: false },
        { type: 'text', name: 'entityId', required: false },
        { type: 'text', name: 'entityName', required: false },
        { type: 'json', name: 'details', required: false, maxSize: 2000000 },
        { type: 'text', name: 'ipAddress', required: false },
        { type: 'text', name: 'userAgent', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('audit_logs')
      app.delete(collection)
    } catch {}
  }
)
