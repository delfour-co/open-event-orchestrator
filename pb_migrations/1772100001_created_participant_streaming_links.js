/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create participant_streaming_links collection
 *
 * Stores unique streaming links for participants when access level is 'unique'.
 * Each participant gets a unique token to access the stream.
 */
migrate(
  (app) => {
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
          cascadeDelete: true,
          collectionId: 'pbc_3660498186', // sessions
          hidden: false,
          id: 'sessionId',
          maxSelect: 1,
          minSelect: 1,
          name: 'sessionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'participantId',
          max: 50,
          min: 1,
          name: 'participantId',
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
          id: 'uniqueToken',
          max: 32,
          min: 32,
          name: 'uniqueToken',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'streamUrl',
          max: 500,
          min: 0,
          name: 'streamUrl',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'url'
        },
        {
          hidden: false,
          id: 'accessedAt',
          max: '',
          min: '',
          name: 'accessedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'accessCount',
          max: null,
          min: 0,
          name: 'accessCount',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'maxAccess',
          max: null,
          min: 1,
          name: 'maxAccess',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'expiresAt',
          max: '',
          min: '',
          name: 'expiresAt',
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
      id: 'pbc_streaming_links',
      indexes: [
        'CREATE UNIQUE INDEX `idx_participant_streaming_token` ON `participant_streaming_links` (`uniqueToken`)',
        'CREATE INDEX `idx_participant_streaming_session` ON `participant_streaming_links` (`sessionId`)',
        'CREATE UNIQUE INDEX `idx_participant_streaming_session_participant` ON `participant_streaming_links` (`sessionId`, `participantId`)'
      ],
      listRule: '',
      name: 'participant_streaming_links',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_streaming_links')
    return app.delete(collection)
  }
)
