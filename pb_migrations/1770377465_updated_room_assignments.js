/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_986726503')

    // add field
    collection.fields.addAt(
      8,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2237629860',
        hidden: false,
        id: 'memberId',
        maxSelect: 1,
        minSelect: 0,
        name: 'memberId',
        presentable: false,
        required: false,
        system: false,
        type: 'relation'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_986726503')

    // remove field
    collection.fields.removeById('memberId')

    return app.save(collection)
  }
)
