/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Create invoice_counters collection for sequential invoice numbering.
 * Each organization has one counter row; the `lastNumber` field is atomically incremented.
 */
migrate(
  (app) => {
    const collection = new Collection({
      id: 'pbc_invoice_counters',
      name: 'invoice_counters',
      type: 'base',
      system: false,
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: null,
      fields: [
        {
          autogeneratePattern: '[a-z0-9]{15}',
          hidden: false,
          id: 'text3208210256',
          max: 15,
          min: 15,
          name: 'id',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: 'text'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_2873630990',
          hidden: false,
          id: 'organizationId',
          maxSelect: 1,
          minSelect: 0,
          name: 'organizationId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'lastNumber',
          max: null,
          min: 0,
          name: 'lastNumber',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'prefix',
          max: 20,
          min: 0,
          name: 'prefix',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text',
          autogeneratePattern: ''
        }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_invoice_counters_org ON invoice_counters (organizationId)']
    })

    app.save(collection)

    // Add invoiceNumber field to edition_sponsors
    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.addMarshaledJSON(
      JSON.stringify([{ type: 'text', name: 'invoiceNumber', max: 30 }])
    )
    app.save(editionSponsors)

    // Add invoiceNumber field to orders
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.addMarshaledJSON(
      JSON.stringify([{ type: 'text', name: 'invoiceNumber', max: 30 }])
    )
    app.save(orders)
  },
  (app) => {
    // Remove invoiceNumber from orders
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.removeByName('invoiceNumber')
    app.save(orders)

    // Remove invoiceNumber from edition_sponsors
    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.removeByName('invoiceNumber')
    app.save(editionSponsors)

    const collection = app.findCollectionByNameOrId('invoice_counters')
    app.delete(collection)
  }
)
