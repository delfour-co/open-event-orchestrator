/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'appName', required: false },
        { type: 'url', name: 'appUrl', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    collection.fields.removeByName('appName')
    collection.fields.removeByName('appUrl')
    app.save(collection)
  }
)
