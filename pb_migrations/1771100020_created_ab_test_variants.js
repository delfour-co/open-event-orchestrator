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
          collectionId: 'pbc_ab_test_campaigns',
          hidden: false,
          id: 'testId',
          maxSelect: 1,
          minSelect: 1,
          name: 'testId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'name',
          maxSelect: 1,
          name: 'name',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
          values: ['A', 'B', 'C']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'subject',
          max: 200,
          min: 1,
          name: 'subject',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'htmlContent',
          max: 500000,
          min: 0,
          name: 'htmlContent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'textContent',
          max: 100000,
          min: 0,
          name: 'textContent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'senderName',
          max: 100,
          min: 0,
          name: 'senderName',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'scheduledAt',
          max: '',
          min: '',
          name: 'scheduledAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'recipientCount',
          max: null,
          min: 0,
          name: 'recipientCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'sentCount',
          max: null,
          min: 0,
          name: 'sentCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'deliveredCount',
          max: null,
          min: 0,
          name: 'deliveredCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'openedCount',
          max: null,
          min: 0,
          name: 'openedCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'clickedCount',
          max: null,
          min: 0,
          name: 'clickedCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'bouncedCount',
          max: null,
          min: 0,
          name: 'bouncedCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'isWinner',
          name: 'isWinner',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
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
      id: 'pbc_ab_test_variants',
      indexes: [
        'CREATE INDEX idx_ab_variants_test ON ab_test_variants (testId)',
        'CREATE UNIQUE INDEX idx_ab_variants_unique ON ab_test_variants (testId, name)'
      ],
      name: 'ab_test_variants',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_ab_test_variants')
    return app.delete(collection)
  }
)
