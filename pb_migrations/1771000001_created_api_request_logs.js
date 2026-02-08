/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '',
      deleteRule: '',
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
          collectionId: 'pbc_api_keys',
          hidden: false,
          id: 'apiKeyId',
          maxSelect: 1,
          minSelect: 0,
          name: 'apiKeyId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'method',
          max: 10,
          min: 1,
          name: 'method',
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
          id: 'path',
          max: 2000,
          min: 1,
          name: 'path',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'statusCode',
          max: null,
          min: 100,
          name: 'statusCode',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'responseTimeMs',
          max: null,
          min: 0,
          name: 'responseTimeMs',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'ipAddress',
          max: 45,
          min: 0,
          name: 'ipAddress',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'userAgent',
          max: 500,
          min: 0,
          name: 'userAgent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
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
        }
      ],
      id: 'pbc_api_request_logs',
      indexes: [
        'CREATE INDEX idx_api_request_logs_api_key ON api_request_logs (apiKeyId)',
        'CREATE INDEX idx_api_request_logs_created ON api_request_logs (created)'
      ],
      listRule: '@request.auth.id != ""',
      name: 'api_request_logs',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_api_request_logs')

    return app.delete(collection)
  }
)
