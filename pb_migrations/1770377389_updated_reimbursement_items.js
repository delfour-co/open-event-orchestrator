/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2926239131')

    // add field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_516151630',
        hidden: false,
        id: 'requestId',
        maxSelect: 1,
        minSelect: 0,
        name: 'requestId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2926239131')

    // remove field
    collection.fields.removeById('requestId')

    return app.save(collection)
  }
)
