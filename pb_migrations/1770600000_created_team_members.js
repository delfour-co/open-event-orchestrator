/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
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
          collectionId: 'pbc_3605007359',
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
          id: 'slug',
          max: 100,
          min: 2,
          name: 'slug',
          pattern: '^[a-z0-9-]+$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
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
          id: 'team',
          max: 100,
          min: 0,
          name: 'team',
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
          id: 'role',
          max: 200,
          min: 0,
          name: 'role',
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
          id: 'bio',
          max: 2000,
          min: 0,
          name: 'bio',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'photo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          name: 'photo',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['100x100', '200x200'],
          type: 'file'
        },
        {
          exceptDomains: [],
          hidden: false,
          id: 'photoUrl',
          name: 'photoUrl',
          onlyDomains: [],
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          hidden: false,
          id: 'socials',
          maxSize: 2000000,
          name: 'socials',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'displayOrder',
          max: null,
          min: 0,
          name: 'displayOrder',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
      id: 'pbc_team_members',
      indexes: [
        'CREATE UNIQUE INDEX idx_team_members_edition_slug ON team_members (editionId, slug)',
        'CREATE INDEX idx_team_members_edition ON team_members (editionId)',
        'CREATE INDEX idx_team_members_team ON team_members (team)'
      ],
      listRule: '',
      name: 'team_members',
      system: false,
      type: 'base',
      updateRule: '@request.auth.id != ""',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_team_members')

    return app.delete(collection)
  }
)
