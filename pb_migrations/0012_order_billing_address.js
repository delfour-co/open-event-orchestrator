/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('orders')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'billingAddress',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 500
        },
        {
          type: 'text',
          name: 'billingCity',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 100
        },
        {
          type: 'text',
          name: 'billingPostalCode',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        },
        {
          type: 'text',
          name: 'billingCountry',
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
    const collection = app.findCollectionByNameOrId('orders')

    collection.fields.removeByName('billingAddress')
    collection.fields.removeByName('billingCity')
    collection.fields.removeByName('billingPostalCode')
    collection.fields.removeByName('billingCountry')

    app.save(collection)
  }
)
