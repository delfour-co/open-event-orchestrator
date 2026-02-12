/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'automations',
      name: 'automations',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'eventId',
          name: 'eventId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name']
          }
        },
        {
          system: false,
          id: 'editionId',
          name: 'editionId',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'editions',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name']
          }
        },
        {
          system: false,
          id: 'name',
          name: 'name',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 200,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'description',
          name: 'description',
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
          id: 'triggerType',
          name: 'triggerType',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
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
          }
        },
        {
          system: false,
          id: 'triggerConfig',
          name: 'triggerConfig',
          type: 'json',
          required: true,
          options: {
            maxSize: 65536
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
            values: ['draft', 'active', 'paused']
          }
        },
        {
          system: false,
          id: 'startStepId',
          name: 'startStepId',
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
          id: 'enrollmentCount',
          name: 'enrollmentCount',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'completedCount',
          name: 'completedCount',
          type: 'number',
          required: false,
          options: {
            min: 0,
            max: null,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'createdBy',
          name: 'createdBy',
          type: 'relation',
          required: false,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['email']
          }
        }
      ],
      indexes: [
        'CREATE INDEX idx_automations_eventId ON automations (eventId)',
        'CREATE INDEX idx_automations_editionId ON automations (editionId)',
        'CREATE INDEX idx_automations_status ON automations (status)',
        'CREATE INDEX idx_automations_triggerType ON automations (triggerType)'
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
    const collection = app.findCollectionByNameOrId('automations')
    return app.delete(collection)
  }
)
