/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2433341001')

    // add field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1636713223',
        hidden: false,
        id: 'speakerId',
        maxSelect: 1,
        minSelect: 0,
        name: 'speakerId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2433341001')

    // remove field
    collection.fields.removeById('speakerId')

    return app.save(collection)
  }
)
