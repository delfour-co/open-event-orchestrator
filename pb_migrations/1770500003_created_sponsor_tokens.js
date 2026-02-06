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
          collectionId: 'pbc_edition_sponsors',
          hidden: false,
          id: 'editionSponsorId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionSponsorId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
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
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'lastUsedAt',
          max: '',
          min: '',
          name: 'lastUsedAt',
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
        }
      ],
      id: 'pbc_sponsor_tokens',
      indexes: [
        'CREATE UNIQUE INDEX idx_sponsor_tokens_token ON sponsor_tokens (token)',
        'CREATE INDEX idx_sponsor_tokens_edition_sponsor ON sponsor_tokens (editionSponsorId)'
      ],
      listRule: '',
      name: 'sponsor_tokens',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsor_tokens')

    return app.delete(collection)
  }
)
