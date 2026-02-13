/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'ticket_templates',
      name: 'ticket_templates',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'edition_id',
          name: 'editionId',
          type: 'relation',
          required: true,
          presentable: false,
          options: {
            collectionId: 'editions',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: ['name']
          }
        },
        {
          system: false,
          id: 'primary_color',
          name: 'primaryColor',
          type: 'text',
          required: false,
          presentable: false,
          options: {
            min: null,
            max: 7,
            pattern: '^#[0-9A-Fa-f]{6}$'
          }
        },
        {
          system: false,
          id: 'background_color',
          name: 'backgroundColor',
          type: 'text',
          required: false,
          presentable: false,
          options: {
            min: null,
            max: 7,
            pattern: '^#[0-9A-Fa-f]{6}$'
          }
        },
        {
          system: false,
          id: 'text_color',
          name: 'textColor',
          type: 'text',
          required: false,
          presentable: false,
          options: {
            min: null,
            max: 7,
            pattern: '^#[0-9A-Fa-f]{6}$'
          }
        },
        {
          system: false,
          id: 'accent_color',
          name: 'accentColor',
          type: 'text',
          required: false,
          presentable: false,
          options: {
            min: null,
            max: 7,
            pattern: '^#[0-9A-Fa-f]{6}$'
          }
        },
        {
          system: false,
          id: 'logo_url',
          name: 'logoUrl',
          type: 'url',
          required: false,
          presentable: false,
          options: {
            exceptDomains: [],
            onlyDomains: []
          }
        },
        {
          system: false,
          id: 'logo_file',
          name: 'logoFile',
          type: 'file',
          required: false,
          presentable: false,
          options: {
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            thumbs: ['300x0'],
            maxSelect: 1,
            maxSize: 2097152
          }
        },
        {
          system: false,
          id: 'show_venue',
          name: 'showVenue',
          type: 'bool',
          required: false,
          presentable: false,
          options: {}
        },
        {
          system: false,
          id: 'show_date',
          name: 'showDate',
          type: 'bool',
          required: false,
          presentable: false,
          options: {}
        },
        {
          system: false,
          id: 'show_qr_code',
          name: 'showQrCode',
          type: 'bool',
          required: false,
          presentable: false,
          options: {}
        },
        {
          system: false,
          id: 'custom_footer_text',
          name: 'customFooterText',
          type: 'text',
          required: false,
          presentable: false,
          options: {
            min: null,
            max: 200,
            pattern: ''
          }
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
    const collection = app.findCollectionByNameOrId('ticket_templates')
    return app.delete(collection)
  }
)
