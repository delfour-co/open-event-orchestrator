/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('editions')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'termsOfSale',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50000
        },
        {
          type: 'text',
          name: 'codeOfConduct',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50000
        },
        {
          type: 'text',
          name: 'privacyPolicy',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50000
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('editions')

    collection.fields.removeByName('termsOfSale')
    collection.fields.removeByName('codeOfConduct')
    collection.fields.removeByName('privacyPolicy')

    app.save(collection)
  }
)
