/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Remove the old role field
    const roleField = collection.fields.getByName('role')
    if (roleField) {
      collection.fields.removeById(roleField.id)
    }

    // Add new role field with updated values
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'select',
          name: 'role',
          required: false,
          maxSelect: 1,
          values: ['super_admin', 'admin', 'organizer', 'reviewer', 'speaker', 'attendee']
        }
      ])
    )

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    const roleField = collection.fields.getByName('role')
    if (roleField) {
      collection.fields.removeById(roleField.id)
    }

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'select',
          name: 'role',
          required: false,
          maxSelect: 1,
          values: ['super_admin', 'org_admin', 'org_member', 'speaker', 'attendee']
        }
      ])
    )

    app.save(collection)
  }
)
