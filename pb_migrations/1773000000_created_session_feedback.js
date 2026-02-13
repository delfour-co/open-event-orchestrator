/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != "" && @request.data.userId = @request.auth.id',
      deleteRule: '@request.auth.id = userId',
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
          collectionId: 'pbc_3660498186',
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
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'userId',
          maxSelect: 1,
          minSelect: 1,
          name: 'userId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'ratingMode',
          maxSelect: 1,
          name: 'ratingMode',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['stars', 'scale_10', 'thumbs', 'yes_no']
        },
        {
          hidden: false,
          id: 'numericValue',
          max: null,
          min: null,
          name: 'numericValue',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'comment',
          max: 2000,
          min: 0,
          name: 'comment',
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
      id: 'pbc_session_feedback',
      indexes: ['CREATE UNIQUE INDEX idx_session_user ON session_feedback (sessionId, userId)'],
      listRule: '',
      name: 'session_feedback',
      system: false,
      type: 'base',
      updateRule: '@request.auth.id = userId',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_session_feedback')

    return app.delete(collection)
  }
)
