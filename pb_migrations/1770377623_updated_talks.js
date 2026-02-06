/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2355380017')

    // add field
    collection.fields.addAt(
      14,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1636713223',
        hidden: false,
        id: 'speakerIds',
        maxSelect: 10,
        minSelect: 0,
        name: 'speakerIds',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2355380017')

    // remove field
    collection.fields.removeById('speakerIds')

    return app.save(collection)
  }
)
