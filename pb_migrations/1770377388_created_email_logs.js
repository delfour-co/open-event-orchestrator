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
          hidden: false,
          id: 'type',
          maxSelect: 1,
          name: 'type',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'submission_confirmed',
            'talk_accepted',
            'talk_rejected',
            'confirmation_reminder',
            'cfp_closing_reminder'
          ]
        },
        {
          exceptDomains: null,
          hidden: false,
          id: 'to',
          name: 'to',
          onlyDomains: null,
          presentable: false,
          required: true,
          system: false,
          type: 'email'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'subject',
          max: 0,
          min: 0,
          name: 'subject',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
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
          values: ['sent', 'failed', 'pending']
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
      id: 'pbc_2433341001',
      indexes: [],
      listRule: '',
      name: 'email_logs',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2433341001')

    return app.delete(collection)
  }
)
