/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('edition_sponsors')

    // Add stripePaymentIntentId text field
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          name: 'stripePaymentIntentId',
          required: false,
          system: false,
          hidden: false,
          presentable: false
        }
      ])
    )

    // Update status select field to include 'refunded'
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          id: 'status',
          type: 'select',
          name: 'status',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          maxSelect: 1,
          values: [
            'prospect',
            'contacted',
            'negotiating',
            'confirmed',
            'declined',
            'cancelled',
            'refunded'
          ]
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('edition_sponsors')

    collection.fields.removeByName('stripePaymentIntentId')

    // Revert status field to original values
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          id: 'status',
          type: 'select',
          name: 'status',
          required: false,
          system: false,
          hidden: false,
          presentable: false,
          maxSelect: 1,
          values: ['prospect', 'contacted', 'negotiating', 'confirmed', 'declined', 'cancelled']
        }
      ])
    )

    app.save(collection)
  }
)
