/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Categories collection
    const categories = new Collection({
      name: 'categories',
      type: 'base',
      fields: [
        {
          name: 'editionId',
          type: 'relation',
          required: true,
          options: { collectionId: 'editions', maxSelect: 1 }
        },
        { name: 'name', type: 'text', required: true, options: { min: 2, max: 50 } },
        { name: 'description', type: 'text', options: { max: 500 } },
        { name: 'color', type: 'text', options: { pattern: '^#[0-9A-Fa-f]{6}$' } },
        { name: 'order', type: 'number', options: { min: 0 } }
      ],
      indexes: ['CREATE INDEX idx_categories_edition ON categories (editionId)']
    })
    app.save(categories)

    // Formats collection
    const formats = new Collection({
      name: 'formats',
      type: 'base',
      fields: [
        {
          name: 'editionId',
          type: 'relation',
          required: true,
          options: { collectionId: 'editions', maxSelect: 1 }
        },
        { name: 'name', type: 'text', required: true, options: { min: 2, max: 50 } },
        { name: 'description', type: 'text', options: { max: 500 } },
        { name: 'duration', type: 'number', required: true, options: { min: 5, max: 480 } },
        { name: 'order', type: 'number', options: { min: 0 } }
      ],
      indexes: ['CREATE INDEX idx_formats_edition ON formats (editionId)']
    })
    app.save(formats)

    // Speakers collection
    const speakers = new Collection({
      name: 'speakers',
      type: 'base',
      fields: [
        { name: 'userId', type: 'relation', options: { collectionId: 'users', maxSelect: 1 } },
        { name: 'email', type: 'email', required: true },
        { name: 'firstName', type: 'text', required: true, options: { min: 1, max: 50 } },
        { name: 'lastName', type: 'text', required: true, options: { min: 1, max: 50 } },
        { name: 'bio', type: 'text', options: { max: 2000 } },
        { name: 'company', type: 'text', options: { max: 100 } },
        { name: 'jobTitle', type: 'text', options: { max: 100 } },
        { name: 'photoUrl', type: 'url' },
        { name: 'twitter', type: 'text', options: { max: 50 } },
        { name: 'linkedin', type: 'url' },
        { name: 'github', type: 'text', options: { max: 50 } },
        { name: 'city', type: 'text', options: { max: 100 } },
        { name: 'country', type: 'text', options: { max: 100 } }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_speakers_email ON speakers (email)',
        'CREATE INDEX idx_speakers_user ON speakers (userId)'
      ]
    })
    app.save(speakers)

    // Talks collection
    const talks = new Collection({
      name: 'talks',
      type: 'base',
      fields: [
        {
          name: 'editionId',
          type: 'relation',
          required: true,
          options: { collectionId: 'editions', maxSelect: 1 }
        },
        { name: 'title', type: 'text', required: true, options: { min: 5, max: 200 } },
        { name: 'abstract', type: 'text', required: true, options: { min: 50, max: 500 } },
        { name: 'description', type: 'text', options: { max: 5000 } },
        {
          name: 'categoryId',
          type: 'relation',
          options: { collectionId: 'categories', maxSelect: 1 }
        },
        { name: 'formatId', type: 'relation', options: { collectionId: 'formats', maxSelect: 1 } },
        {
          name: 'language',
          type: 'select',
          required: true,
          options: { values: ['fr', 'en'] }
        },
        {
          name: 'level',
          type: 'select',
          options: { values: ['beginner', 'intermediate', 'advanced'] }
        },
        {
          name: 'speakerIds',
          type: 'relation',
          required: true,
          options: { collectionId: 'speakers', maxSelect: 5 }
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: [
              'draft',
              'submitted',
              'under_review',
              'accepted',
              'rejected',
              'confirmed',
              'declined',
              'withdrawn'
            ]
          }
        },
        { name: 'submittedAt', type: 'date' },
        { name: 'notes', type: 'text', options: { max: 2000 } }
      ],
      indexes: [
        'CREATE INDEX idx_talks_edition ON talks (editionId)',
        'CREATE INDEX idx_talks_status ON talks (status)',
        'CREATE INDEX idx_talks_category ON talks (categoryId)',
        'CREATE INDEX idx_talks_format ON talks (formatId)'
      ]
    })
    app.save(talks)
  },
  (app) => {
    app.findCollectionByNameOrId('talks')?.delete()
    app.findCollectionByNameOrId('speakers')?.delete()
    app.findCollectionByNameOrId('formats')?.delete()
    app.findCollectionByNameOrId('categories')?.delete()
  }
)
