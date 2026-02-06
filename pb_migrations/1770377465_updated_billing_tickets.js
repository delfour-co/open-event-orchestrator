/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1361378225')

    // add field
    collection.fields.addAt(
      12,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_647540413',
        hidden: false,
        id: 'ticketTypeId',
        maxSelect: 1,
        minSelect: 0,
        name: 'ticketTypeId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1361378225')

    // remove field
    collection.fields.removeById('ticketTypeId')

    return app.save(collection)
  }
)
