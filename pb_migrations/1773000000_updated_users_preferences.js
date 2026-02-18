/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // Add preferences JSON field for storing user settings
    collection.fields.addAt(
      11,
      new Field({
        hidden: false,
        id: 'preferences',
        maxSize: 2000,
        name: 'preferences',
        presentable: false,
        required: false,
        system: false,
        type: 'json'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // Remove preferences field
    collection.fields.removeById('preferences')

    return app.save(collection)
  }
)
