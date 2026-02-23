/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'legalForm',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50
        },
        {
          type: 'text',
          name: 'rcsNumber',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50
        },
        {
          type: 'text',
          name: 'shareCapital',
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
    const collection = app.findCollectionByNameOrId('organizations')

    collection.fields.removeByName('legalForm')
    collection.fields.removeByName('rcsNumber')
    collection.fields.removeByName('shareCapital')

    app.save(collection)
  }
)
