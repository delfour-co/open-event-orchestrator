/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Restore missing fields on organizations
    const orgs = app.findCollectionByNameOrId('organizations')
    const orgFields = orgs.fields.map((f) => f.name)

    const orgMissing = []
    if (!orgFields.includes('logo')) {
      orgMissing.push({
        type: 'file',
        name: 'logo',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        required: false,
        thumbs: ['100x100', '200x200', '400x400']
      })
    }
    if (!orgFields.includes('website')) {
      orgMissing.push({
        type: 'url',
        name: 'website',
        required: false,
        exceptDomains: [],
        onlyDomains: []
      })
    }
    if (!orgFields.includes('contactEmail')) {
      orgMissing.push({ type: 'email', name: 'contactEmail', required: false })
    }
    if (!orgFields.includes('ownerId')) {
      orgMissing.push({ type: 'text', name: 'ownerId', required: false })
    }

    if (orgMissing.length > 0) {
      orgs.fields.addMarshaledJSON(JSON.stringify(orgMissing))
      app.save(orgs)
    }

    // Restore missing fields on events
    const events = app.findCollectionByNameOrId('events')
    const eventFields = events.fields.map((f) => f.name)

    const eventMissing = []
    if (!eventFields.includes('logo')) {
      eventMissing.push({
        type: 'file',
        name: 'logo',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        required: false,
        thumbs: ['100x100', '200x200', '400x400']
      })
    }
    if (!eventFields.includes('website')) {
      eventMissing.push({
        type: 'url',
        name: 'website',
        required: false,
        exceptDomains: [],
        onlyDomains: []
      })
    }
    if (!eventFields.includes('defaultVenue')) {
      eventMissing.push({ type: 'text', name: 'defaultVenue', required: false })
    }
    if (!eventFields.includes('defaultCity')) {
      eventMissing.push({ type: 'text', name: 'defaultCity', required: false })
    }
    if (!eventFields.includes('defaultCountry')) {
      eventMissing.push({ type: 'text', name: 'defaultCountry', required: false })
    }

    if (eventMissing.length > 0) {
      events.fields.addMarshaledJSON(JSON.stringify(eventMissing))
      app.save(events)
    }
  },
  (app) => {
    // No rollback — these fields should always exist
  }
)
