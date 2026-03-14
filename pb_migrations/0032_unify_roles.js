/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Update org_admin → admin
    const orgAdmins = app.findRecordsByFilter('users', 'role = "org_admin"', '', 0, 0)
    for (const user of orgAdmins) {
      user.set('role', 'admin')
      app.save(user)
    }
    // Update org_member → organizer
    const orgMembers = app.findRecordsByFilter('users', 'role = "org_member"', '', 0, 0)
    for (const user of orgMembers) {
      user.set('role', 'organizer')
      app.save(user)
    }
  },
  (app) => {
    // Reverse: admin → org_admin
    const admins = app.findRecordsByFilter('users', 'role = "admin"', '', 0, 0)
    for (const user of admins) {
      user.set('role', 'org_admin')
      app.save(user)
    }
    // Reverse: organizer → org_member
    const organizers = app.findRecordsByFilter('users', 'role = "organizer"', '', 0, 0)
    for (const user of organizers) {
      user.set('role', 'org_member')
      app.save(user)
    }
  }
)
