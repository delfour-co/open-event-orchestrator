/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // add field
    collection.fields.addAt(
      8,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2355380017',
        hidden: false,
        id: 'talkId',
        maxSelect: 1,
        minSelect: 0,
        name: 'talkId',
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
    collection.fields.removeById('talkId')

    return app.save(collection)
  }
)
