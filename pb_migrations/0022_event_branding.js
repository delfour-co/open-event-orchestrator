/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'file',
          name: 'banner',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
          thumbs: []
        },
        { type: 'text', name: 'primaryColor', required: false },
        { type: 'text', name: 'secondaryColor', required: false },
        { type: 'url', name: 'twitter', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'linkedin', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'text', name: 'hashtag', required: false },
        { type: 'email', name: 'contactEmail', required: false },
        {
          type: 'url',
          name: 'codeOfConductUrl',
          required: false,
          exceptDomains: [],
          onlyDomains: []
        },
        {
          type: 'url',
          name: 'privacyPolicyUrl',
          required: false,
          exceptDomains: [],
          onlyDomains: []
        },
        { type: 'text', name: 'timezone', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('events')
    const fields = [
      'banner',
      'primaryColor',
      'secondaryColor',
      'twitter',
      'linkedin',
      'hashtag',
      'contactEmail',
      'codeOfConductUrl',
      'privacyPolicyUrl',
      'timezone'
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
