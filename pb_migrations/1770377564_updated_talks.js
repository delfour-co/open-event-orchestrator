/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2355380017')

    // add field
    collection.fields.addAt(
      13,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2632959446',
        hidden: false,
        id: 'formatId',
        maxSelect: 1,
        minSelect: 0,
        name: 'formatId',
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
    collection.fields.removeById('formatId')

    return app.save(collection)
  }
)
