/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pwa_settings')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'bool',
          name: 'showNetworkingTab',
          required: false,
          system: false,
          hidden: false,
          presentable: false
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pwa_settings')

    const field = collection.fields.getByName('showNetworkingTab')
    if (field) {
      collection.fields.removeById(field.id)
    }

    app.save(collection)
  }
)
