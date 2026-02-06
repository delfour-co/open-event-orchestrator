/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // add field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_327047008',
        hidden: false,
        id: 'trackId',
        maxSelect: 1,
        minSelect: 0,
        name: 'trackId',
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
    collection.fields.removeById('trackId')

    return app.save(collection)
  }
)
