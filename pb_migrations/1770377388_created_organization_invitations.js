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
          exceptDomains: null,
          hidden: false,
          id: 'email',
          name: 'email',
          onlyDomains: null,
          presentable: false,
          required: true,
          system: false,
          type: 'email'
        },
        {
          hidden: false,
          id: 'role',
          maxSelect: 1,
          name: 'role',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['admin', 'organizer', 'reviewer']
        },
        {
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['pending', 'accepted', 'expired', 'cancelled']
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
      id: 'pbc_1587060730',
      indexes: [],
      listRule: '',
      name: 'organization_invitations',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1587060730')

    return app.delete(collection)
  }
)
