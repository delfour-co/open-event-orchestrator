/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_53644091')

    // add field
    collection.fields.addAt(
      7,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3085411453',
        hidden: false,
        id: 'roomId',
        maxSelect: 1,
        minSelect: 0,
        name: 'roomId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_53644091')

    // remove field
    collection.fields.removeById('roomId')

    return app.save(collection)
  }
)
