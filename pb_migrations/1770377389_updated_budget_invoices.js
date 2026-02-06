/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3551302563')

    // add field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1371503333',
        hidden: false,
        id: 'transactionId',
        maxSelect: 1,
        minSelect: 0,
        name: 'transactionId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3551302563')

    // remove field
    collection.fields.removeById('transactionId')

    return app.save(collection)
  }
)
