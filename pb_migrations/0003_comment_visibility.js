/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('comments')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'select',
          name: 'visibility',
          required: false,
          maxSelect: 1,
          values: ['internal', 'public']
        },
        {
          type: 'text',
          name: 'authorName',
          required: false
        }
      ])
    )
    app.save(collection)
  },
  (app) => {}
)
