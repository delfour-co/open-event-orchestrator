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
          collectionId: 'pbc_1687431684',
          hidden: false,
          id: 'eventId',
          maxSelect: 1,
          minSelect: 1,
          name: 'eventId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
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
          id: 'triggerType',
          maxSelect: 1,
          name: 'triggerType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'contact_created',
            'ticket_purchased',
            'checked_in',
            'tag_added',
            'consent_given',
            'scheduled_date',
            'talk_submitted',
            'talk_accepted',
            'talk_rejected'
          ]
        },
        {
          hidden: false,
          id: 'triggerConfig',
          maxSize: 65536,
          name: 'triggerConfig',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
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
          values: ['draft', 'active', 'paused']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'startStepId',
          max: 50,
          min: 0,
          name: 'startStepId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'enrollmentCount',
          max: null,
          min: 0,
          name: 'enrollmentCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'completedCount',
          max: null,
          min: 0,
          name: 'completedCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
          required: false,
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
      id: 'pbc_automations',
      indexes: [
        'CREATE INDEX idx_automations_eventId ON automations (eventId)',
        'CREATE INDEX idx_automations_editionId ON automations (editionId)',
        'CREATE INDEX idx_automations_status ON automations (status)',
        'CREATE INDEX idx_automations_triggerType ON automations (triggerType)'
      ],
      name: 'automations',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_automations')
    return app.delete(collection)
  }
)
