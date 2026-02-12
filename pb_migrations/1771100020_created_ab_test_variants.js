/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'ab_test_variants',
      name: 'ab_test_variants',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'testid',
          name: 'testId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'ab_test_campaigns',
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
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['A', 'B', 'C']
          }
        },
        {
          system: false,
          id: 'subject',
          name: 'subject',
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
          id: 'htmlcontent',
          name: 'htmlContent',
          type: 'text',
          required: true,
          options: {
            min: null,
            max: 500000,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'textcontent',
          name: 'textContent',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100000,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'sendername',
          name: 'senderName',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'scheduledat',
          name: 'scheduledAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'recipientcount',
          name: 'recipientCount',
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
          id: 'sentcount',
          name: 'sentCount',
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
          id: 'deliveredcount',
          name: 'deliveredCount',
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
          id: 'openedcount',
          name: 'openedCount',
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
          id: 'clickedcount',
          name: 'clickedCount',
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
          id: 'bouncedcount',
          name: 'bouncedCount',
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
          id: 'iswinner',
          name: 'isWinner',
          type: 'bool',
          required: false,
          options: {}
        }
      ],
      indexes: [
        'CREATE INDEX `idx_ab_variants_test` ON `ab_test_variants` (`testId`)',
        'CREATE UNIQUE INDEX `idx_ab_variants_unique` ON `ab_test_variants` (`testId`, `name`)'
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
    const collection = app.findCollectionByNameOrId('ab_test_variants')
    return app.delete(collection)
  }
)
