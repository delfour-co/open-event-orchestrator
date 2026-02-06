/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1899532601')

    // add field
    collection.fields.addAt(
      6,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2708044088',
        hidden: false,
        id: 'budgetId',
        maxSelect: 1,
        minSelect: 0,
        name: 'budgetId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1899532601')

    // remove field
    collection.fields.removeById('budgetId')

    return app.save(collection)
  }
)
