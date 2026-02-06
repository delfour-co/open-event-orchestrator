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
          cascadeDelete: true,
          collectionId: 'pbc_3605007359',
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
          cascadeDelete: false,
          collectionId: 'pbc_sponsors',
          hidden: false,
          id: 'sponsorId',
          maxSelect: 1,
          minSelect: 0,
          name: 'sponsorId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_sponsor_packages',
          hidden: false,
          id: 'packageId',
          maxSelect: 1,
          minSelect: 0,
          name: 'packageId',
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
          values: ['prospect', 'contacted', 'negotiating', 'confirmed', 'declined', 'cancelled']
        },
        {
          hidden: false,
          id: 'confirmedAt',
          max: '',
          min: '',
          name: 'confirmedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
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
          id: 'amount',
          max: null,
          min: 0,
          name: 'amount',
          onlyInt: false,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
      id: 'pbc_edition_sponsors',
      indexes: [
        'CREATE INDEX idx_edition_sponsors_edition ON edition_sponsors (editionId)',
        'CREATE INDEX idx_edition_sponsors_sponsor ON edition_sponsors (sponsorId)',
        'CREATE UNIQUE INDEX idx_edition_sponsors_unique ON edition_sponsors (editionId, sponsorId)',
        'CREATE INDEX idx_edition_sponsors_status ON edition_sponsors (editionId, status)'
      ],
      listRule: '',
      name: 'edition_sponsors',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_edition_sponsors')

    return app.delete(collection)
  }
)
