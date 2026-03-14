/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')

    // Update the role field's allowed values using addMarshaledJSON
    // which merges by field name instead of removing+re-adding
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          id: 'role',
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

    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          id: 'role',
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
