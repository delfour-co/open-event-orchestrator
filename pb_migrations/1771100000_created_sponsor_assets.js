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
          id: 'category',
          maxSelect: 1,
          name: 'category',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['logo_color', 'logo_mono', 'logo_light', 'logo_dark', 'visual', 'document']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'name',
          max: 200,
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
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 1000,
          min: 0,
          name: 'description',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
            'application/illustrator',
            'application/postscript',
            'image/vnd.adobe.photoshop'
          ],
          name: 'file',
          presentable: false,
          protected: false,
          required: true,
          system: false,
          thumbs: ['100x100', '200x200', '400x400'],
          type: 'file'
        },
        {
          hidden: false,
          id: 'fileSize',
          max: null,
          min: 0,
          name: 'fileSize',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'mimeType',
          max: 100,
          min: 0,
          name: 'mimeType',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'width',
          max: null,
          min: 0,
          name: 'width',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'height',
          max: null,
          min: 0,
          name: 'height',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'usage',
          max: 500,
          min: 0,
          name: 'usage',
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
      id: 'pbc_sponsor_assets',
      indexes: [
        'CREATE INDEX idx_sponsor_assets_edition_sponsor ON sponsor_assets (editionSponsorId)',
        'CREATE INDEX idx_sponsor_assets_category ON sponsor_assets (editionSponsorId, category)'
      ],
      listRule: '',
      name: 'sponsor_assets',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_sponsor_assets')

    return app.delete(collection)
  }
)
