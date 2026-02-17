/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // Find and update the role field to match domain schema
    const roleField = collection.fields.find((f) => f.name === 'role')
    if (roleField) {
      roleField.values = ['super_admin', 'org_admin', 'org_member', 'speaker', 'attendee']
    }

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('_pb_users_auth_')

    // Revert to old role values
    const roleField = collection.fields.find((f) => f.name === 'role')
    if (roleField) {
      roleField.values = ['speaker', 'organizer', 'reviewer', 'admin']
    }

    return app.save(collection)
  }
)
