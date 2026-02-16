/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const editionsCollection = app.findCollectionByNameOrId('editions')
    const packagesCollection = app.findCollectionByNameOrId('sponsor_packages')

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
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'companyName',
          max: 200,
          min: 1,
          name: 'companyName',
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
          id: 'contactName',
          max: 200,
          min: 1,
          name: 'contactName',
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
          id: 'contactEmail',
          name: 'contactEmail',
          onlyDomains: null,
          presentable: false,
          required: true,
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
          id: 'message',
          max: 5000,
          min: 1,
          name: 'message',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          cascadeDelete: false,
          collectionId: packagesCollection.id,
          hidden: false,
          id: 'interestedPackageId',
          maxSelect: 1,
          minSelect: 0,
          name: 'interestedPackageId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
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
          values: ['pending', 'contacted', 'converted', 'rejected']
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
      id: 'pbc_sponsor_inquiries',
      indexes: [
        'CREATE INDEX idx_sponsor_inquiries_edition ON sponsor_inquiries (editionId)',
        'CREATE INDEX idx_sponsor_inquiries_status ON sponsor_inquiries (status)',
        'CREATE INDEX idx_sponsor_inquiries_created ON sponsor_inquiries (created)'
      ],
      listRule: '',
      name: 'sponsor_inquiries',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsor_inquiries')

    return app.delete(collection)
  }
)
