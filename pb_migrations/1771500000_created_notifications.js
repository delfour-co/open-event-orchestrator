/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: 'userId = @request.auth.id',
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
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'userId',
          maxSelect: 1,
          minSelect: 0,
          name: 'userId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'type',
          maxSelect: 1,
          name: 'type',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['system', 'alert', 'reminder', 'action']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'title',
          max: 200,
          min: 1,
          name: 'title',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'message',
          max: 1000,
          min: 1,
          name: 'message',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'isRead',
          name: 'isRead',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          exceptDomains: null,
          hidden: false,
          id: 'link',
          name: 'link',
          onlyDomains: null,
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          hidden: false,
          id: 'metadata',
          maxSize: 5000,
          name: 'metadata',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'deletedAt',
          max: '',
          min: '',
          name: 'deletedAt',
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
      id: 'pbc_notifications',
      indexes: [
        'CREATE INDEX `idx_notifications_userId` ON `notifications` (`userId`)',
        'CREATE INDEX `idx_notifications_userId_isRead` ON `notifications` (`userId`, `isRead`)',
        'CREATE INDEX `idx_notifications_userId_type` ON `notifications` (`userId`, `type`)',
        'CREATE INDEX `idx_notifications_userId_deletedAt` ON `notifications` (`userId`, `deletedAt`)'
      ],
      listRule: 'userId = @request.auth.id',
      name: 'notifications',
      system: false,
      type: 'base',
      updateRule: 'userId = @request.auth.id',
      viewRule: 'userId = @request.auth.id'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_notifications')

    return app.delete(collection)
  }
)
