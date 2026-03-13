/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('event_feedback')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'number',
          name: 'numericValue',
          min: 1,
          max: 5,
          required: false
        }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('event_feedback')
    const field = collection.fields.getByName('numericValue')
    if (field) {
      collection.fields.removeById(field.id)
      app.save(collection)
    }
  }
)
