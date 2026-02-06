/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_516151630')

    // add field
    collection.fields.addAt(
      13,
      new Field({
        cascadeDelete: false,
        collectionId: '_pb_users_auth_',
        hidden: false,
        id: 'reviewedBy',
        maxSelect: 1,
        minSelect: 0,
        name: 'reviewedBy',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_516151630')

    // remove field
    collection.fields.removeById('reviewedBy')

    return app.save(collection)
  }
)
