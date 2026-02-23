/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add invoicePdf file field to orders
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'file',
          name: 'invoicePdf',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf']
        }
      ])
    )
    app.save(orders)

    // Add invoicePdf file field to edition_sponsors
    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'file',
          name: 'invoicePdf',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf']
        }
      ])
    )
    app.save(editionSponsors)
  },
  (app) => {
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.removeByName('invoicePdf')
    app.save(orders)

    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.removeByName('invoicePdf')
    app.save(editionSponsors)
  }
)
