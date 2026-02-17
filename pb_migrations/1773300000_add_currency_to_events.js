/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1687431684')

    // Add currency field with default USD
    collection.fields.addAt(
      7,
      new Field({
        hidden: false,
        id: 'currency',
        maxSelect: 1,
        name: 'currency',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'INR', 'BRL']
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1687431684')

    collection.fields.removeById('currency')

    return app.save(collection)
  }
)
