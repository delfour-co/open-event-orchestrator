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
          cascadeDelete: false,
          collectionId: 'pbc_1719698224',
          hidden: false,
          id: 'segmentId',
          maxSelect: 1,
          minSelect: 0,
          name: 'segmentId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'testVariable',
          maxSelect: 1,
          name: 'testVariable',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['subject', 'content', 'sender_name', 'send_time']
        },
        {
          hidden: false,
          id: 'winnerCriteria',
          maxSelect: 1,
          name: 'winnerCriteria',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['open_rate', 'click_rate']
        },
        {
          hidden: false,
          id: 'testPercentage',
          max: 50,
          min: 10,
          name: 'testPercentage',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'testDurationHours',
          max: 168,
          min: 1,
          name: 'testDurationHours',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
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
          values: ['draft', 'testing', 'winner_selected', 'completed', 'cancelled']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'winnerVariantId',
          max: 50,
          min: 0,
          name: 'winnerVariantId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'winnerSelectedAt',
          max: '',
          min: '',
          name: 'winnerSelectedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'testStartedAt',
          max: '',
          min: '',
          name: 'testStartedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'testEndedAt',
          max: '',
          min: '',
          name: 'testEndedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'totalRecipients',
          max: null,
          min: 0,
          name: 'totalRecipients',
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
      id: 'pbc_ab_test_campaigns',
      indexes: [
        'CREATE INDEX idx_ab_tests_event ON ab_test_campaigns (eventId)',
        'CREATE INDEX idx_ab_tests_edition ON ab_test_campaigns (editionId)',
        'CREATE INDEX idx_ab_tests_status ON ab_test_campaigns (status)'
      ],
      name: 'ab_test_campaigns',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_ab_test_campaigns')
    return app.delete(collection)
  }
)
