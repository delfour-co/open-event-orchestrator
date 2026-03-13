/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pwa_settings')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'json',
          name: 'floorAmenities',
          maxSize: 0,
          required: false
        }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pwa_settings')
    const field = collection.fields.getByName('floorAmenities')
    if (field) {
      collection.fields.removeById(field.id)
      app.save(collection)
    }
  }
)
