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
          id: 'bio',
          max: 0,
          min: 0,
          name: 'bio',
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
          id: 'company',
          max: 0,
          min: 0,
          name: 'company',
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
          id: 'jobTitle',
          max: 0,
          min: 0,
          name: 'jobTitle',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          exceptDomains: null,
          hidden: false,
          id: 'photoUrl',
          name: 'photoUrl',
          onlyDomains: null,
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'twitter',
          max: 0,
          min: 0,
          name: 'twitter',
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
          id: 'github',
          max: 0,
          min: 0,
          name: 'github',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          exceptDomains: null,
          hidden: false,
          id: 'linkedin',
          name: 'linkedin',
          onlyDomains: null,
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'city',
          max: 0,
          min: 0,
          name: 'city',
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
          id: 'country',
          max: 0,
          min: 0,
          name: 'country',
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
      id: 'pbc_1636713223',
      indexes: [],
      listRule: '',
      name: 'speakers',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1636713223')

    return app.delete(collection)
  }
)
