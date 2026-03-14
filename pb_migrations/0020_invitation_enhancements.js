/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organization_invitations')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'token', required: false },
        { type: 'date', name: 'lastSentAt', required: false }
      ])
    )
    // Add unique index on token
    collection.indexes = collection.indexes || []
    collection.indexes.push(
      'CREATE UNIQUE INDEX idx_invitation_token ON organization_invitations (token) WHERE token != ""'
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organization_invitations')
    const tokenField = collection.fields.getByName('token')
    if (tokenField) {
      collection.fields.removeById(tokenField.id)
    }
    const lastSentField = collection.fields.getByName('lastSentAt')
    if (lastSentField) {
      collection.fields.removeById(lastSentField.id)
    }
    // Remove the index
    collection.indexes = (collection.indexes || []).filter(
      (idx) => !idx.includes('idx_invitation_token')
    )
    app.save(collection)
  }
)
