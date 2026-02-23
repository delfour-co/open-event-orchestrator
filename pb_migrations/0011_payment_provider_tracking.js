/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add paymentProvider field to orders
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'paymentProvider',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        }
      ])
    )
    app.save(orders)

    // Add paymentProvider field to edition_sponsors
    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'paymentProvider',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        }
      ])
    )
    app.save(editionSponsors)
  },
  (app) => {
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.removeByName('paymentProvider')
    app.save(orders)

    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.removeByName('paymentProvider')
    app.save(editionSponsors)
  }
)
