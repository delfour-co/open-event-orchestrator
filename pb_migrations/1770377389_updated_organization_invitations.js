/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1587060730')

    // add field
    collection.fields.addAt(
      7,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2873630990',
        hidden: false,
        id: 'organizationId',
        maxSelect: 1,
        minSelect: 0,
        name: 'organizationId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1587060730')

    // remove field
    collection.fields.removeById('organizationId')

    return app.save(collection)
  }
)
