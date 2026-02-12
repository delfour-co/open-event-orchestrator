/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'automation_enrollments',
      name: 'automation_enrollments',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'automationId',
          name: 'automationId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'automations',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name']
          }
        },
        {
          system: false,
          id: 'contactId',
          name: 'contactId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'contacts',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['email']
          }
        },
        {
          system: false,
          id: 'currentStepId',
          name: 'currentStepId',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'status',
          name: 'status',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['active', 'completed', 'exited', 'failed']
          }
        },
        {
          system: false,
          id: 'startedAt',
          name: 'startedAt',
          type: 'date',
          required: true,
          options: {}
        },
        {
          system: false,
          id: 'completedAt',
          name: 'completedAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'exitedAt',
          name: 'exitedAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'exitReason',
          name: 'exitReason',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 500,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'waitUntil',
          name: 'waitUntil',
          type: 'date',
          required: false,
          options: {}
        }
      ],
      indexes: [
        'CREATE INDEX idx_automation_enrollments_automationId ON automation_enrollments (automationId)',
        'CREATE INDEX idx_automation_enrollments_contactId ON automation_enrollments (contactId)',
        'CREATE INDEX idx_automation_enrollments_status ON automation_enrollments (status)',
        'CREATE UNIQUE INDEX idx_automation_enrollments_unique ON automation_enrollments (automationId, contactId)',
        'CREATE INDEX idx_automation_enrollments_waitUntil ON automation_enrollments (waitUntil)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('automation_enrollments')
    return app.delete(collection)
  }
)
