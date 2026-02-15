/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Find existing collections
    const editionsCollection = app.findCollectionByNameOrId('editions')

    const collection = new Collection({
      id: 'pbc_ticket_templates',
      name: 'ticket_templates',
      type: 'base',
      system: false,
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
          id: 'primaryColor',
          max: 7,
          min: 0,
          name: 'primaryColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'backgroundColor',
          max: 7,
          min: 0,
          name: 'backgroundColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'textColor',
          max: 7,
          min: 0,
          name: 'textColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'accentColor',
          max: 7,
          min: 0,
          name: 'accentColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          exceptDomains: [],
          hidden: false,
          id: 'logoUrl',
          name: 'logoUrl',
          onlyDomains: [],
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          hidden: false,
          id: 'logoFile',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          name: 'logoFile',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['300x0'],
          type: 'file'
        },
        {
          hidden: false,
          id: 'showVenue',
          name: 'showVenue',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'showDate',
          name: 'showDate',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'showQrCode',
          name: 'showQrCode',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'customFooterText',
          max: 200,
          min: 0,
          name: 'customFooterText',
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
      indexes: ['CREATE UNIQUE INDEX idx_ticket_templates_edition ON ticket_templates (editionId)'],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_ticket_templates')
    return app.delete(collection)
  }
)
