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
          collectionId: 'pbc_3605007359',
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'type',
          maxSelect: 1,
          name: 'type',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'break',
            'lunch',
            'registration',
            'networking',
            'sponsor',
            'announcement',
            'ceremony',
            'custom'
          ]
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'title',
          max: 200,
          min: 1,
          name: 'title',
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
          max: 2000,
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
          id: 'icon',
          maxSelect: 1,
          name: 'icon',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: [
            'coffee',
            'utensils',
            'clipboard-check',
            'users',
            'megaphone',
            'info',
            'award',
            'star'
          ]
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'color',
          max: 7,
          min: 7,
          name: 'color',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'date',
          max: '',
          min: '',
          name: 'date',
          presentable: false,
          required: true,
          system: false,
          type: 'date'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'startTime',
          max: 5,
          min: 5,
          name: 'startTime',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'endTime',
          max: 5,
          min: 5,
          name: 'endTime',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
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
          id: 'roomIds',
          maxSize: 2000000,
          name: 'roomIds',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'isPublic',
          name: 'isPublic',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'sortOrder',
          max: null,
          min: 0,
          name: 'sortOrder',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
      id: 'pbc_service_sessions',
      indexes: [
        'CREATE INDEX idx_service_sessions_edition ON service_sessions (editionId)',
        'CREATE INDEX idx_service_sessions_date ON service_sessions (date)',
        'CREATE INDEX idx_service_sessions_type ON service_sessions (type)'
      ],
      name: 'service_sessions',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_service_sessions')

    return app.delete(collection)
  }
)
