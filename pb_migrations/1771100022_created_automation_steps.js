/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'automation_steps',
      name: 'automation_steps',
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
          id: 'type',
          name: 'type',
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
          id: 'name',
          name: 'name',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 200,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'config',
          name: 'config',
          type: 'json',
          required: true,
          options: {
            maxSize: 65536
          }
        },
        {
          system: false,
          id: 'position',
          name: 'position',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: null,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'nextStepId',
          name: 'nextStepId',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50,
            pattern: ''
          }
        }
      ],
      indexes: [
        'CREATE INDEX idx_automation_steps_automationId ON automation_steps (automationId)',
        'CREATE INDEX idx_automation_steps_type ON automation_steps (type)',
        'CREATE INDEX idx_automation_steps_position ON automation_steps (position)'
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
    const collection = app.findCollectionByNameOrId('automation_steps')
    return app.delete(collection)
  }
)
