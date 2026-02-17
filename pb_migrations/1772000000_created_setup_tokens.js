/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: null,
      deleteRule: null,
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
          id: 'token',
          max: 0,
          min: 0,
          name: 'token',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'expiresAt',
          max: '',
          min: '',
          name: 'expiresAt',
          presentable: false,
          required: true,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'used',
          name: 'used',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'usedAt',
          max: '',
          min: '',
          name: 'usedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
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
      id: 'pbc_setup_tokens',
      indexes: ['CREATE UNIQUE INDEX idx_setup_tokens_token ON setup_tokens (token)'],
      listRule: null,
      name: 'setup_tokens',
      system: false,
      type: 'base',
      updateRule: null,
      viewRule: null
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_setup_tokens')

    return app.delete(collection)
  }
)
