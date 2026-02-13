/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: null,
      listRule: '@request.auth.id != ""',
      updateRule: null,
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
          collectionId: 'pbc_automation_enrollments',
          hidden: false,
          id: 'enrollmentId',
          maxSelect: 1,
          minSelect: 1,
          name: 'enrollmentId',
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
          id: 'stepId',
          max: 50,
          min: 1,
          name: 'stepId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'stepType',
          maxSelect: 1,
          name: 'stepType',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
          values: [
            'send_email',
            'wait',
            'condition',
            'add_tag',
            'remove_tag',
            'update_field',
            'webhook'
          ]
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
          values: ['pending', 'executing', 'completed', 'failed', 'skipped']
        },
        {
          hidden: false,
          id: 'input',
          maxSize: 65536,
          name: 'input',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'output',
          maxSize: 65536,
          name: 'output',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'error',
          max: 2000,
          min: 0,
          name: 'error',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'executedAt',
          max: '',
          min: '',
          name: 'executedAt',
          presentable: false,
          required: true,
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
      id: 'pbc_automation_logs',
      indexes: [
        'CREATE INDEX idx_automation_logs_automationId ON automation_logs (automationId)',
        'CREATE INDEX idx_automation_logs_enrollmentId ON automation_logs (enrollmentId)',
        'CREATE INDEX idx_automation_logs_contactId ON automation_logs (contactId)',
        'CREATE INDEX idx_automation_logs_status ON automation_logs (status)',
        'CREATE INDEX idx_automation_logs_executedAt ON automation_logs (executedAt)'
      ],
      name: 'automation_logs',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_automation_logs')
    return app.delete(collection)
  }
)
