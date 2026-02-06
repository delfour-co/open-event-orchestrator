/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_516151630')

    // add field
    collection.fields.addAt(
      11,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3605007359',
        hidden: false,
        id: 'editionId',
        maxSelect: 1,
        minSelect: 0,
        name: 'editionId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_516151630')

    // remove field
    collection.fields.removeById('editionId')

    return app.save(collection)
  }
)
