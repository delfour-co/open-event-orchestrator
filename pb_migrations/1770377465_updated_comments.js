/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_533777971')

    // add field
    collection.fields.addAt(
      6,
      new Field({
        cascadeDelete: false,
        collectionId: '_pb_users_auth_',
        hidden: false,
        id: 'userId',
        maxSelect: 1,
        minSelect: 0,
        name: 'userId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_533777971')

    // remove field
    collection.fields.removeById('userId')

    return app.save(collection)
  }
)
