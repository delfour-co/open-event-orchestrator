/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'legalName',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 300
        },
        {
          type: 'text',
          name: 'siret',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        },
        {
          type: 'text',
          name: 'vatNumber',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 50
        },
        {
          type: 'text',
          name: 'address',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 500
        },
        {
          type: 'text',
          name: 'city',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 100
        },
        {
          type: 'text',
          name: 'postalCode',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        },
        {
          type: 'text',
          name: 'country',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 100
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')

    collection.fields.removeByName('legalName')
    collection.fields.removeByName('siret')
    collection.fields.removeByName('vatNumber')
    collection.fields.removeByName('address')
    collection.fields.removeByName('city')
    collection.fields.removeByName('postalCode')
    collection.fields.removeByName('country')

    app.save(collection)
  }
)
