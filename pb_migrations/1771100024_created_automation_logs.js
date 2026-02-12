/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'automation_logs',
      name: 'automation_logs',
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
          id: 'enrollmentId',
          name: 'enrollmentId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'automation_enrollments',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: []
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
          id: 'stepId',
          name: 'stepId',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 50,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'stepType',
          name: 'stepType',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: [
              'send_email',
              'wait',
              'condition',
              'add_tag',
              'remove_tag',
              'update_field',
              'webhook'
            ]
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
            values: ['pending', 'executing', 'completed', 'failed', 'skipped']
          }
        },
        {
          system: false,
          id: 'input',
          name: 'input',
          type: 'json',
          required: false,
          options: {
            maxSize: 65536
          }
        },
        {
          system: false,
          id: 'output',
          name: 'output',
          type: 'json',
          required: false,
          options: {
            maxSize: 65536
          }
        },
        {
          system: false,
          id: 'error',
          name: 'error',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 2000,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'executedAt',
          name: 'executedAt',
          type: 'date',
          required: true,
          options: {}
        }
      ],
      indexes: [
        'CREATE INDEX idx_automation_logs_automationId ON automation_logs (automationId)',
        'CREATE INDEX idx_automation_logs_enrollmentId ON automation_logs (enrollmentId)',
        'CREATE INDEX idx_automation_logs_contactId ON automation_logs (contactId)',
        'CREATE INDEX idx_automation_logs_status ON automation_logs (status)',
        'CREATE INDEX idx_automation_logs_executedAt ON automation_logs (executedAt)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: null,
      deleteRule: null
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('automation_logs')
    return app.delete(collection)
  }
)
