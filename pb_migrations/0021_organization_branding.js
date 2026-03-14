/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'primaryColor', required: false },
        { type: 'text', name: 'secondaryColor', required: false },
        { type: 'url', name: 'twitter', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'linkedin', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'github', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'youtube', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'text', name: 'timezone', required: false },
        { type: 'text', name: 'defaultLocale', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('organizations')
    const fields = [
      'primaryColor',
      'secondaryColor',
      'twitter',
      'linkedin',
      'github',
      'youtube',
      'timezone',
      'defaultLocale'
    ]
    for (const fieldName of fields) {
      const field = collection.fields.getByName(fieldName)
      if (field) {
        collection.fields.removeById(field.id)
      }
    }
    app.save(collection)
  }
)
