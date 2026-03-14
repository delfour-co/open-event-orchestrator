/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'bool', name: 'oauth2Enabled', required: false },
        { type: 'text', name: 'googleOAuthClientId', required: false },
        { type: 'text', name: 'googleOAuthClientSecret', required: false },
        { type: 'text', name: 'githubOAuthClientId', required: false },
        { type: 'text', name: 'githubOAuthClientSecret', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    const fields = [
      'oauth2Enabled',
      'googleOAuthClientId',
      'googleOAuthClientSecret',
      'githubOAuthClientId',
      'githubOAuthClientSecret'
    ]
    for (const name of fields) {
      const field = collection.fields.getByName(name)
      if (field) {
        collection.fields.removeById(field.id)
      }
    }
    app.save(collection)
  }
)
