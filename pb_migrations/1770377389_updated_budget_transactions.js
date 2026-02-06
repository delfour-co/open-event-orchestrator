/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1371503333')

    // add field
    collection.fields.addAt(
      10,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1899532601',
        hidden: false,
        id: 'categoryId',
        maxSelect: 1,
        minSelect: 0,
        name: 'categoryId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1371503333')

    // remove field
    collection.fields.removeById('categoryId')

    return app.save(collection)
  }
)
