/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3605007359')

    // add field
    collection.fields.addAt(
      12,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1687431684',
        hidden: false,
        id: 'eventId',
        maxSelect: 1,
        minSelect: 0,
        name: 'eventId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3605007359')

    // remove field
    collection.fields.removeById('eventId')

    return app.save(collection)
  }
)
