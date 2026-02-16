/// <reference path="../pb_data/types.d.ts" />
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
          collectionId: 'pbc_edition_sponsors',
          hidden: false,
          id: 'editionSponsorId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionSponsorId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'senderType',
          maxSelect: 1,
          name: 'senderType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['organizer', 'sponsor']
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'senderUserId',
          maxSelect: 1,
          minSelect: 0,
          name: 'senderUserId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'senderName',
          max: 200,
          min: 0,
          name: 'senderName',
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
          id: 'subject',
          max: 500,
          min: 0,
          name: 'subject',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'content',
          max: 10000,
          min: 1,
          name: 'content',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'attachments',
          maxSelect: 10,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          name: 'attachments',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['100x100'],
          type: 'file'
        },
        {
          hidden: false,
          id: 'readAt',
          max: '',
          min: '',
          name: 'readAt',
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
      id: 'pbc_sponsor_messages',
      indexes: [
        'CREATE INDEX idx_sponsor_messages_edition_sponsor ON sponsor_messages (editionSponsorId)',
        'CREATE INDEX idx_sponsor_messages_sender_type ON sponsor_messages (editionSponsorId, senderType)',
        'CREATE INDEX idx_sponsor_messages_unread ON sponsor_messages (editionSponsorId, readAt)',
        'CREATE INDEX idx_sponsor_messages_created ON sponsor_messages (editionSponsorId, created DESC)'
      ],
      listRule: '',
      name: 'sponsor_messages',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsor_messages')

    return app.delete(collection)
  }
)
