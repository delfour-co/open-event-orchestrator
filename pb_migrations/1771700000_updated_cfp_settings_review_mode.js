/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2176234591')

    // add reviewMode field
    collection.fields.addAt(
      11,
      new Field({
        hidden: false,
        id: 'reviewMode',
        maxSelect: 1,
        name: 'reviewMode',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['stars', 'yes_no', 'comparative']
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2176234591')

    // remove field
    collection.fields.removeById('reviewMode')

    return app.save(collection)
  }
)
