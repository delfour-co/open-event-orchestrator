/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const editionsCollection = app.findCollectionByNameOrId('editions')

    const collection = new Collection({
      createRule: '',
      deleteRule: '',
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
          cascadeDelete: false,
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'name',
          max: 100,
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
          hidden: false,
          id: 'enabled',
          name: 'enabled',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'frequency',
          max: 20,
          min: 1,
          name: 'frequency',
          pattern: '^(daily|weekly|monthly)$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'dayOfWeek',
          max: 20,
          min: 0,
          name: 'dayOfWeek',
          pattern: '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)?$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'dayOfMonth',
          max: 31,
          min: 1,
          name: 'dayOfMonth',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'timeOfDay',
          max: 5,
          min: 5,
          name: 'timeOfDay',
          pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'timezone',
          max: 50,
          min: 1,
          name: 'timezone',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'recipients',
          maxSize: 10000,
          name: 'recipients',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'sections',
          maxSize: 1000,
          name: 'sections',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'lastSentAt',
          max: '',
          min: '',
          name: 'lastSentAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'nextScheduledAt',
          max: '',
          min: '',
          name: 'nextScheduledAt',
          presentable: false,
          required: false,
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
      id: 'pbc_report_configs',
      indexes: [
        'CREATE INDEX idx_report_configs_edition ON report_configs (editionId)',
        'CREATE INDEX idx_report_configs_enabled ON report_configs (enabled)',
        'CREATE INDEX idx_report_configs_next_scheduled ON report_configs (nextScheduledAt)'
      ],
      listRule: '',
      name: 'report_configs',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_report_configs')

    return app.delete(collection)
  }
)
