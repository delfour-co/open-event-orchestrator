/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('email_templates')

    collection.fields.push({
      hidden: false,
      id: 'documentJson',
      maxSize: 10000000,
      name: 'documentJson',
      presentable: false,
      required: false,
      system: false,
      type: 'json'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('email_templates')

    const field = collection.fields.find((f) => f.name === 'documentJson')
    if (field) {
      collection.fields = collection.fields.filter((f) => f.name !== 'documentJson')
    }

    return app.save(collection)
  }
)
