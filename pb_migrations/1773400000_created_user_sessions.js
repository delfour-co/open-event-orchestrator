/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'user_sessions',
      name: 'user_sessions',
      type: 'base',
      system: false,
      fields: [
        {
          id: 'userId',
          name: 'userId',
          type: 'relation',
          required: true,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['email']
          }
        },
        {
          id: 'tokenHash',
          name: 'tokenHash',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 100
          }
        },
        {
          id: 'userAgent',
          name: 'userAgent',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 500
          }
        },
        {
          id: 'ipAddress',
          name: 'ipAddress',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50
          }
        },
        {
          id: 'browser',
          name: 'browser',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50
          }
        },
        {
          id: 'browserVersion',
          name: 'browserVersion',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 20
          }
        },
        {
          id: 'os',
          name: 'os',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50
          }
        },
        {
          id: 'osVersion',
          name: 'osVersion',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 20
          }
        },
        {
          id: 'device',
          name: 'device',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50
          }
        },
        {
          id: 'city',
          name: 'city',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100
          }
        },
        {
          id: 'country',
          name: 'country',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 100
          }
        },
        {
          id: 'lastActive',
          name: 'lastActive',
          type: 'date',
          required: true
        }
      ],
      indexes: ['CREATE INDEX idx_user_sessions_userId ON user_sessions (userId)'],
      listRule: '@request.auth.id = userId',
      viewRule: '@request.auth.id = userId',
      createRule: null,
      updateRule: null,
      deleteRule: '@request.auth.id = userId'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('user_sessions')
    return app.delete(collection)
  }
)
