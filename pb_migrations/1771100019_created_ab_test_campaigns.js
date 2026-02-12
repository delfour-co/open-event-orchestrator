/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'ab_test_campaigns',
      name: 'ab_test_campaigns',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'eventid',
          name: 'eventId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'editionid',
          name: 'editionId',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'editions',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
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
          id: 'segmentid',
          name: 'segmentId',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'segments',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'testvariable',
          name: 'testVariable',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['subject', 'content', 'sender_name', 'send_time']
          }
        },
        {
          system: false,
          id: 'winnercriteria',
          name: 'winnerCriteria',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['open_rate', 'click_rate']
          }
        },
        {
          system: false,
          id: 'testpercentage',
          name: 'testPercentage',
          type: 'number',
          required: true,
          options: {
            min: 10,
            max: 50,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'testdurationhours',
          name: 'testDurationHours',
          type: 'number',
          required: true,
          options: {
            min: 1,
            max: 168,
            noDecimal: true
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
            values: ['draft', 'testing', 'winner_selected', 'completed', 'cancelled']
          }
        },
        {
          system: false,
          id: 'winnervariantid',
          name: 'winnerVariantId',
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
          id: 'winnerselectedat',
          name: 'winnerSelectedAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'teststartedat',
          name: 'testStartedAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'testendedat',
          name: 'testEndedAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'totalrecipients',
          name: 'totalRecipients',
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
          id: 'createdby',
          name: 'createdBy',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'users',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        }
      ],
      indexes: [
        'CREATE INDEX `idx_ab_tests_event` ON `ab_test_campaigns` (`eventId`)',
        'CREATE INDEX `idx_ab_tests_edition` ON `ab_test_campaigns` (`editionId`)',
        'CREATE INDEX `idx_ab_tests_status` ON `ab_test_campaigns` (`status`)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      options: {}
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('ab_test_campaigns')
    return app.delete(collection)
  }
)
