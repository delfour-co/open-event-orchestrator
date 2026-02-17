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
          collectionId: 'pbc_1899532601',
          hidden: false,
          id: 'categoryId',
          maxSelect: 1,
          minSelect: 0,
          name: 'categoryId',
          presentable: false,
          required: false,
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
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 1000,
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
          id: 'estimatedAmount',
          max: null,
          min: 0,
          name: 'estimatedAmount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
          values: ['pending', 'approved', 'ordered', 'paid', 'cancelled']
        },
        {
          hidden: false,
          id: 'priority',
          maxSelect: 1,
          name: 'priority',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['low', 'medium', 'high']
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
          autogeneratePattern: '',
          hidden: false,
          id: 'assignee',
          max: 200,
          min: 0,
          name: 'assignee',
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
          max: 2000,
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
          id: 'order',
          max: null,
          min: 0,
          name: 'order',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_1371503333',
          hidden: false,
          id: 'transactionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'transactionId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'createdBy',
          maxSelect: 1,
          minSelect: 0,
          name: 'createdBy',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
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
      id: 'pbc_budget_checklist_items',
      indexes: [
        'CREATE INDEX idx_checklist_items_edition ON budget_checklist_items (editionId)',
        'CREATE INDEX idx_checklist_items_category ON budget_checklist_items (categoryId)',
        'CREATE INDEX idx_checklist_items_status ON budget_checklist_items (editionId, status)',
        'CREATE INDEX idx_checklist_items_order ON budget_checklist_items (editionId, `order`)'
      ],
      listRule: '',
      name: 'budget_checklist_items',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_budget_checklist_items')

    return app.delete(collection)
  }
)
