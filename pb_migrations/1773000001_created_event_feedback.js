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
          collectionId: 'pbc_editions',
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 1,
          name: 'editionId',
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
          id: 'feedbackType',
          maxSelect: 1,
          name: 'feedbackType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['general', 'problem']
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
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'message',
          max: 5000,
          min: 1,
          name: 'message',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['open', 'acknowledged', 'resolved', 'closed']
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
      id: 'pbc_event_feedback',
      indexes: [],
      listRule: '',
      name: 'event_feedback',
      system: false,
      type: 'base',
      updateRule: '@request.auth.id = userId',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_event_feedback')

    return app.delete(collection)
  }
)
