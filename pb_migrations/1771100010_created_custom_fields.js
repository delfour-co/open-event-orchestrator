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
          id: 'eventId',
          max: 0,
          min: 0,
          name: 'eventId',
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
          id: 'name',
          max: 100,
          min: 1,
          name: 'name',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'key',
          max: 50,
          min: 1,
          name: 'key',
          pattern: '^[a-z][a-z0-9_]*$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'fieldType',
          maxSelect: 1,
          name: 'fieldType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['text', 'number', 'date', 'select', 'checkbox', 'url', 'textarea']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 500,
          min: 0,
          name: 'description',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'isRequired',
          name: 'isRequired',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'options',
          maxSize: 2000000,
          name: 'options',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'displayOrder',
          max: 1000,
          min: 0,
          name: 'displayOrder',
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'isActive',
          name: 'isActive',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
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
      id: 'pbc_custom_fields',
      indexes: [
        'CREATE UNIQUE INDEX idx_custom_fields_event_key ON custom_fields (eventId, key)',
        'CREATE INDEX idx_custom_fields_event ON custom_fields (eventId)'
      ],
      listRule: '',
      name: 'custom_fields',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_custom_fields')

    return app.delete(collection)
  }
)
