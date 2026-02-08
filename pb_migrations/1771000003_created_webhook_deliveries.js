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
          collectionId: 'pbc_webhooks',
          hidden: false,
          id: 'webhookId',
          maxSelect: 1,
          minSelect: 0,
          name: 'webhookId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'event',
          max: 100,
          min: 1,
          name: 'event',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'payload',
          maxSize: 2000000,
          name: 'payload',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'statusCode',
          max: null,
          min: null,
          name: 'statusCode',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'responseBody',
          max: 0,
          min: 0,
          name: 'responseBody',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'attempt',
          max: null,
          min: 1,
          name: 'attempt',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'nextRetryAt',
          max: '',
          min: '',
          name: 'nextRetryAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'deliveredAt',
          max: '',
          min: '',
          name: 'deliveredAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'error',
          max: 0,
          min: 0,
          name: 'error',
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
      id: 'pbc_webhook_deliveries',
      indexes: [
        'CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries (webhookId)',
        'CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries (event)',
        'CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries (created)',
        'CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries (nextRetryAt)'
      ],
      listRule: '@request.auth.id != ""',
      name: 'webhook_deliveries',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_webhook_deliveries')

    return app.delete(collection)
  }
)
