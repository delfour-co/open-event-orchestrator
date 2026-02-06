/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // update collection data
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""'
      },
      collection
    )

    // add field
    collection.fields.addAt(
      10,
      new Field({
        hidden: false,
        id: 'role',
        maxSelect: 1,
        name: 'role',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['speaker', 'organizer', 'reviewer', 'admin']
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // update collection data
    unmarshal(
      {
        listRule: 'id = @request.auth.id',
        viewRule: 'id = @request.auth.id'
      },
      collection
    )

    // remove field
    collection.fields.removeById('role')

    return app.save(collection)
  }
)
