/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'json',
          name: 'notificationPreferences',
          maxSize: 2000000,
          required: false
        }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    const field = collection.fields.getByName('notificationPreferences')
    if (field) {
      collection.fields.removeById(field.id)
      app.save(collection)
    }
  }
)
