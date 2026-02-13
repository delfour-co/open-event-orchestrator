/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      listRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
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
          collectionId: 'pbc_automations',
          hidden: false,
          id: 'automationId',
          maxSelect: 1,
          minSelect: 1,
          name: 'automationId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'contactId',
          maxSelect: 1,
          minSelect: 1,
          name: 'contactId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'currentStepId',
          max: 50,
          min: 0,
          name: 'currentStepId',
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
          presentable: true,
          required: true,
          system: false,
          type: 'select',
          values: ['active', 'completed', 'exited', 'failed']
        },
        {
          hidden: false,
          id: 'startedAt',
          max: '',
          min: '',
          name: 'startedAt',
          presentable: false,
          required: true,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'completedAt',
          max: '',
          min: '',
          name: 'completedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'exitedAt',
          max: '',
          min: '',
          name: 'exitedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'exitReason',
          max: 500,
          min: 0,
          name: 'exitReason',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'waitUntil',
          max: '',
          min: '',
          name: 'waitUntil',
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
      id: 'pbc_automation_enrollments',
      indexes: [
        'CREATE INDEX idx_automation_enrollments_automationId ON automation_enrollments (automationId)',
        'CREATE INDEX idx_automation_enrollments_contactId ON automation_enrollments (contactId)',
        'CREATE INDEX idx_automation_enrollments_status ON automation_enrollments (status)',
        'CREATE UNIQUE INDEX idx_automation_enrollments_unique ON automation_enrollments (automationId, contactId)',
        'CREATE INDEX idx_automation_enrollments_waitUntil ON automation_enrollments (waitUntil)'
      ],
      name: 'automation_enrollments',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_automation_enrollments')
    return app.delete(collection)
  }
)
