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
          id: 'orderNumber',
          max: 0,
          min: 0,
          name: 'orderNumber',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
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
          autogeneratePattern: '',
          hidden: false,
          id: 'firstName',
          max: 0,
          min: 0,
          name: 'firstName',
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
          id: 'lastName',
          max: 0,
          min: 0,
          name: 'lastName',
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
          required: false,
          system: false,
          type: 'select',
          values: ['pending', 'paid', 'cancelled', 'refunded']
        },
        {
          hidden: false,
          id: 'totalAmount',
          max: null,
          min: null,
          name: 'totalAmount',
          onlyInt: false,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'currency',
          maxSelect: 1,
          name: 'currency',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['EUR', 'USD', 'GBP']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'stripeSessionId',
          max: 0,
          min: 0,
          name: 'stripeSessionId',
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
          id: 'stripePaymentIntentId',
          max: 0,
          min: 0,
          name: 'stripePaymentIntentId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'paidAt',
          max: '',
          min: '',
          name: 'paidAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'cancelledAt',
          max: '',
          min: '',
          name: 'cancelledAt',
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
      id: 'pbc_3527180448',
      indexes: [],
      listRule: '',
      name: 'orders',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3527180448')

    return app.delete(collection)
  }
)
