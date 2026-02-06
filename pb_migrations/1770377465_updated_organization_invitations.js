/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1587060730')

    // add field
    collection.fields.addAt(
      8,
      new Field({
        cascadeDelete: false,
        collectionId: '_pb_users_auth_',
        hidden: false,
        id: 'invitedBy',
        maxSelect: 1,
        minSelect: 0,
        name: 'invitedBy',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1587060730')

    // remove field
    collection.fields.removeById('invitedBy')

    return app.save(collection)
  }
)
