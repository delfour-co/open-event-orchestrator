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
          autogeneratePattern: '',
          hidden: false,
          id: 'email',
          max: 0,
          min: 0,
          name: 'email',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'email'
        },
        {
          hidden: false,
          id: 'reason',
          maxSelect: 1,
          name: 'reason',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['hard_bounce', 'soft_bounce_limit', 'complaint', 'unsubscribe', 'manual']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'source',
          max: 0,
          min: 0,
          name: 'source',
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
          id: 'note',
          max: 0,
          min: 0,
          name: 'note',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          cascadeDelete: false,
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
          cascadeDelete: false,
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
      id: 'pbc_suppression_list',
      indexes: [
        'CREATE UNIQUE INDEX idx_suppression_list_email ON suppression_list (email)',
        'CREATE INDEX idx_suppression_list_organization ON suppression_list (organizationId)',
        'CREATE INDEX idx_suppression_list_event ON suppression_list (eventId)',
        'CREATE INDEX idx_suppression_list_reason ON suppression_list (reason)'
      ],
      listRule: '',
      name: 'suppression_list',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_suppression_list')

    return app.delete(collection)
  }
)
