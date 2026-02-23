/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'helloassoClientId',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 200
        },
        {
          type: 'text',
          name: 'helloassoClientSecret',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 200
        },
        {
          type: 'text',
          name: 'helloassoOrgSlug',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 100
        },
        {
          type: 'bool',
          name: 'helloassoEnabled',
          required: false,
          system: false,
          hidden: false,
          presentable: false
        },
        {
          type: 'bool',
          name: 'helloassoSandbox',
          required: false,
          system: false,
          hidden: false,
          presentable: false
        },
        {
          type: 'text',
          name: 'activePaymentProvider',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')

    collection.fields.removeByName('helloassoClientId')
    collection.fields.removeByName('helloassoClientSecret')
    collection.fields.removeByName('helloassoOrgSlug')
    collection.fields.removeByName('helloassoEnabled')
    collection.fields.removeByName('helloassoSandbox')
    collection.fields.removeByName('activePaymentProvider')

    app.save(collection)
  }
)
