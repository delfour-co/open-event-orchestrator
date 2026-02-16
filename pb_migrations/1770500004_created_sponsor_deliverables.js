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
          collectionId: 'pbc_edition_sponsors',
          hidden: false,
          id: 'editionSponsorId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionSponsorId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'benefitName',
          max: 200,
          min: 1,
          name: 'benefitName',
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
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['pending', 'in_progress', 'delivered']
        },
        {
          hidden: false,
          id: 'dueDate',
          max: '',
          min: '',
          name: 'dueDate',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'deliveredAt',
          max: '',
          min: '',
          name: 'deliveredAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
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
      id: 'pbc_sponsor_deliverables',
      indexes: [
        'CREATE INDEX idx_sponsor_deliverables_edition_sponsor ON sponsor_deliverables (editionSponsorId)',
        'CREATE INDEX idx_sponsor_deliverables_status ON sponsor_deliverables (editionSponsorId, status)',
        'CREATE INDEX idx_sponsor_deliverables_due_date ON sponsor_deliverables (dueDate)'
      ],
      listRule: '',
      name: 'sponsor_deliverables',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsor_deliverables')

    return app.delete(collection)
  }
)
