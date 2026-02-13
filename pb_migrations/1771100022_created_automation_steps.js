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
          hidden: false,
          id: 'type',
          maxSelect: 1,
          name: 'type',
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
          autogeneratePattern: '',
          hidden: false,
          id: 'name',
          max: 200,
          min: 0,
          name: 'name',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'config',
          maxSize: 65536,
          name: 'config',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'position',
          max: null,
          min: 0,
          name: 'position',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'nextStepId',
          max: 50,
          min: 0,
          name: 'nextStepId',
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
      id: 'pbc_automation_steps',
      indexes: [
        'CREATE INDEX idx_automation_steps_automationId ON automation_steps (automationId)',
        'CREATE INDEX idx_automation_steps_type ON automation_steps (type)',
        'CREATE INDEX idx_automation_steps_position ON automation_steps (position)'
      ],
      name: 'automation_steps',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_automation_steps')
    return app.delete(collection)
  }
)
