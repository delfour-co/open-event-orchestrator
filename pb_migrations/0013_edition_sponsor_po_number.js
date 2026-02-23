/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('edition_sponsors')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'poNumber',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('edition_sponsors')

    collection.fields.removeByName('poNumber')

    app.save(collection)
  }
)
