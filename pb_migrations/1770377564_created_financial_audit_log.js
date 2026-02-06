/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '',
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
          hidden: false,
          id: 'action',
          maxSelect: 1,
          name: 'action',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: [
            'create',
            'update',
            'delete',
            'status_change',
            'send',
            'accept',
            'reject',
            'convert',
            'submit',
            'approve',
            'mark_paid'
          ]
        },
        {
          hidden: false,
          id: 'entityType',
          maxSelect: 1,
          name: 'entityType',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['transaction', 'quote', 'invoice', 'reimbursement', 'category', 'budget']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'entityId',
          max: 0,
          min: 0,
          name: 'entityId',
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
          id: 'entityReference',
          max: 0,
          min: 0,
          name: 'entityReference',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'oldValue',
          maxSize: 2000000,
          name: 'oldValue',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'newValue',
          maxSize: 2000000,
          name: 'newValue',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'metadata',
          maxSize: 2000000,
          name: 'metadata',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
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
      id: 'pbc_2979272493',
      indexes: [],
      listRule: '',
      name: 'financial_audit_log',
      system: false,
      type: 'base',
      updateRule: null,
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2979272493')

    return app.delete(collection)
  }
)
