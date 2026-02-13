/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      listRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      fields: [
        {
          autogeneratePattern: '[a-z0-9]{15}',
          hidden: false,
          id: 'text3208210256',
          max: 15,
          min: 15,
          name: 'id',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: 'text'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_1687431684',
          hidden: false,
          id: 'eventId',
          maxSelect: 1,
          minSelect: 0,
          name: 'eventId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'name',
          max: 100,
          min: 1,
          name: 'name',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 500,
          min: 0,
          name: 'description',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'category',
          maxSelect: 1,
          name: 'category',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
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
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'subject',
          max: 200,
          min: 1,
          name: 'subject',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'htmlContent',
          max: 500000,
          min: 0,
          name: 'htmlContent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'textContent',
          max: 100000,
          min: 0,
          name: 'textContent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'tags',
          maxSize: 5000,
          name: 'tags',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'thumbnail',
          maxSelect: 1,
          maxSize: 1048576,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          name: 'thumbnail',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['200x150'],
          type: 'file'
        },
        {
          hidden: false,
          id: 'isGlobal',
          name: 'isGlobal',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'isFavorite',
          name: 'isFavorite',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'isPinned',
          name: 'isPinned',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'usageCount',
          max: null,
          min: 0,
          name: 'usageCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'createdBy',
          maxSelect: 1,
          minSelect: 0,
          name: 'createdBy',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'created',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'updated',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      id: 'pbc_library_templates',
      indexes: [
        'CREATE INDEX idx_library_templates_event ON library_templates (eventId)',
        'CREATE INDEX idx_library_templates_category ON library_templates (category)',
        'CREATE INDEX idx_library_templates_global ON library_templates (isGlobal)',
        'CREATE INDEX idx_library_templates_favorite ON library_templates (isFavorite)',
        'CREATE INDEX idx_library_templates_pinned ON library_templates (isPinned)'
      ],
      name: 'library_templates',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_library_templates')
    return app.delete(collection)
  }
)
