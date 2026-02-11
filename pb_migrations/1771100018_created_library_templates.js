/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'library_templates',
      name: 'library_templates',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'eventid',
          name: 'eventId',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'description',
          name: 'description',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 500,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'category',
          name: 'category',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: [
              'invitation',
              'confirmation',
              'reminder',
              'thank_you',
              'newsletter',
              'cfp',
              'speaker',
              'sponsor',
              'custom'
            ]
          }
        },
        {
          system: false,
          id: 'subject',
          name: 'subject',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 200,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'htmlcontent',
          name: 'htmlContent',
          type: 'text',
          required: true,
          options: {
            min: null,
            max: 500000,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'textcontent',
          name: 'textContent',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100000,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'tags',
          name: 'tags',
          type: 'json',
          required: false,
          options: {
            maxSize: 5000
          }
        },
        {
          system: false,
          id: 'thumbnail',
          name: 'thumbnail',
          type: 'file',
          required: false,
          options: {
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            thumbs: ['200x150'],
            maxSelect: 1,
            maxSize: 1048576,
            protected: false
          }
        },
        {
          system: false,
          id: 'isglobal',
          name: 'isGlobal',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'isfavorite',
          name: 'isFavorite',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'ispinned',
          name: 'isPinned',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'usagecount',
          name: 'usageCount',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'createdby',
          name: 'createdBy',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'users',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        }
      ],
      indexes: [
        'CREATE INDEX `idx_library_templates_event` ON `library_templates` (`eventId`)',
        'CREATE INDEX `idx_library_templates_category` ON `library_templates` (`category`)',
        'CREATE INDEX `idx_library_templates_global` ON `library_templates` (`isGlobal`)',
        'CREATE INDEX `idx_library_templates_favorite` ON `library_templates` (`isFavorite`)',
        'CREATE INDEX `idx_library_templates_pinned` ON `library_templates` (`isPinned`)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      options: {}
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('library_templates')
    return app.delete(collection)
  }
)
