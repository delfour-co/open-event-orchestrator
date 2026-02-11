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
          id: 'contactId',
          max: 0,
          min: 0,
          name: 'contactId',
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
          id: 'eventId',
          max: 0,
          min: 0,
          name: 'eventId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'newsletter',
          name: 'newsletter',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'eventUpdates',
          name: 'eventUpdates',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'partnerCommunications',
          name: 'partnerCommunications',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'frequency',
          maxSelect: 1,
          name: 'frequency',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['immediate', 'daily', 'weekly', 'monthly']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'preferenceToken',
          max: 0,
          min: 0,
          name: 'preferenceToken',
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
      id: 'pbc_comm_prefs',
      indexes: [
        'CREATE UNIQUE INDEX idx_comm_prefs_contact_event ON communication_preferences (contactId, eventId)',
        'CREATE INDEX idx_comm_prefs_token ON communication_preferences (preferenceToken)'
      ],
      listRule: '',
      name: 'communication_preferences',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_comm_prefs')

    return app.delete(collection)
  }
)
