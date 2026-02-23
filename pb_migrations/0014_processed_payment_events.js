/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection({
      name: 'processed_payment_events',
      type: 'base',
      fields: [
        {
          type: 'text',
          name: 'eventId',
          required: true,
          system: false,
          hidden: false,
          presentable: true,
          max: 200
        },
        {
          type: 'text',
          name: 'provider',
          required: true,
          system: false,
          hidden: false,
          presentable: false,
          max: 20
        },
        {
          type: 'date',
          name: 'processedAt',
          required: true,
          system: false,
          hidden: false,
          presentable: false
        }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_processed_event_id ON processed_payment_events (eventId)']
    })

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('processed_payment_events')
    app.delete(collection)
  }
)
