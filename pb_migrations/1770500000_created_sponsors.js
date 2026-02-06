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
          cascadeDelete: false,
          collectionId: 'pbc_2873630990',
          hidden: false,
          id: 'organizationId',
          maxSelect: 1,
          minSelect: 0,
          name: 'organizationId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'name',
          max: 200,
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
          hidden: false,
          id: 'logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          name: 'logo',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['100x100', '200x200', '400x400'],
          type: 'file'
        },
        {
          exceptDomains: [],
          hidden: false,
          id: 'website',
          name: 'website',
          onlyDomains: [],
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 2000,
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
          autogeneratePattern: '',
          hidden: false,
          id: 'contactName',
          max: 200,
          min: 0,
          name: 'contactName',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          exceptDomains: [],
          hidden: false,
          id: 'contactEmail',
          name: 'contactEmail',
          onlyDomains: [],
          presentable: false,
          required: false,
          system: false,
          type: 'email'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'contactPhone',
          max: 50,
          min: 0,
          name: 'contactPhone',
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
          id: 'notes',
          max: 5000,
          min: 0,
          name: 'notes',
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
      id: 'pbc_sponsors',
      indexes: ['CREATE INDEX idx_sponsors_organization ON sponsors (organizationId)'],
      listRule: '',
      name: 'sponsors',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsors')

    return app.delete(collection)
  }
)
