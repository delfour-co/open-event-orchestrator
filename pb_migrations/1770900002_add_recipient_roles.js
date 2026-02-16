/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('report_configs')

    // Add recipientRoles field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'recipientRoles',
        maxSize: 500,
        name: 'recipientRoles',
        presentable: false,
        required: false,
        system: false,
        type: 'json'
      })
    )

    // Make recipients not required (since we now have recipientRoles)
    const recipientsField = collection.fields.getByName('recipients')
    if (recipientsField) {
      recipientsField.required = false
    }

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('report_configs')

    collection.fields.removeById('recipientRoles')

    // Restore recipients as required
    const recipientsField = collection.fields.getByName('recipients')
    if (recipientsField) {
      recipientsField.required = true
    }

    return app.save(collection)
  }
)
