/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2456927940')

    // add field
    collection.fields.addAt(
      7,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3527180448',
        hidden: false,
        id: 'orderId',
        maxSelect: 1,
        minSelect: 0,
        name: 'orderId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2456927940')

    // remove field
    collection.fields.removeById('orderId')

    return app.save(collection)
  }
)
