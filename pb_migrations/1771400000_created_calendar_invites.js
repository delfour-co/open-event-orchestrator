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
          collectionId: 'pbc_3660498186',
          hidden: false,
          id: 'sessionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'sessionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_1636713223',
          hidden: false,
          id: 'speakerId',
          maxSelect: 1,
          minSelect: 0,
          name: 'speakerId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'speakerEmail',
          max: 255,
          min: 5,
          name: 'speakerEmail',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'method',
          maxSelect: 1,
          name: 'method',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['REQUEST', 'CANCEL']
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
          values: ['pending', 'sent', 'updated', 'cancelled', 'failed']
        },
        {
          hidden: false,
          id: 'sequence',
          max: null,
          min: 0,
          name: 'sequence',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
      id: 'pbc_calendar_invites',
      indexes: [
        'CREATE INDEX idx_calendar_invites_session ON calendar_invites (sessionId)',
        'CREATE INDEX idx_calendar_invites_speaker ON calendar_invites (speakerId)',
        'CREATE UNIQUE INDEX idx_calendar_invites_session_speaker ON calendar_invites (sessionId, speakerId)'
      ],
      name: 'calendar_invites',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_calendar_invites')

    return app.delete(collection)
  }
)
