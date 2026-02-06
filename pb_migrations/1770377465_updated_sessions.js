/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // add field
    collection.fields.addAt(
      7,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_53644091',
        hidden: false,
        id: 'slotId',
        maxSelect: 1,
        minSelect: 0,
        name: 'slotId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // remove field
    collection.fields.removeById('slotId')

    return app.save(collection)
  }
)
