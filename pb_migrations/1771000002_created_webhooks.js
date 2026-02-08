/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
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
          exceptDomains: [],
          hidden: false,
          id: 'url',
          name: 'url',
          onlyDomains: [],
          presentable: false,
          required: true,
          system: false,
          type: 'url'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'secret',
          max: 0,
          min: 0,
          name: 'secret',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_2873630990',
          hidden: false,
          id: 'organizationId',
          maxSelect: 1,
          minSelect: 0,
          name: 'organizationId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
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
          cascadeDelete: true,
          collectionId: 'pbc_3605007359',
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'events',
          maxSize: 2000000,
          name: 'events',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'isActive',
          name: 'isActive',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'headers',
          maxSize: 2000000,
          name: 'headers',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'retryCount',
          max: 10,
          min: 0,
          name: 'retryCount',
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
          required: true,
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
      id: 'pbc_webhooks',
      indexes: [
        'CREATE INDEX idx_webhooks_organization ON webhooks (organizationId)',
        'CREATE INDEX idx_webhooks_event ON webhooks (eventId)',
        'CREATE INDEX idx_webhooks_edition ON webhooks (editionId)',
        'CREATE INDEX idx_webhooks_created_by ON webhooks (createdBy)',
        'CREATE INDEX idx_webhooks_is_active ON webhooks (isActive)'
      ],
      listRule: '@request.auth.id != ""',
      name: 'webhooks',
      system: false,
      type: 'base',
      updateRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_webhooks')

    return app.delete(collection)
  }
)
