/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      listRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
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
          collectionId: 'pbc_1687431684',
          hidden: false,
          id: 'eventId',
          maxSelect: 1,
          minSelect: 1,
          name: 'eventId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'survivorContactId',
          maxSelect: 1,
          minSelect: 1,
          name: 'survivorContactId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'mergedContactId',
          max: 50,
          min: 1,
          name: 'mergedContactId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'survivorData',
          maxSize: 50000,
          name: 'survivorData',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'mergedData',
          maxSize: 50000,
          name: 'mergedData',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'mergeDecisions',
          maxSize: 10000,
          name: 'mergeDecisions',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'mergedBy',
          maxSelect: 1,
          minSelect: 1,
          name: 'mergedBy',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'undone',
          name: 'undone',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'undoneAt',
          max: '',
          min: '',
          name: 'undoneAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'undoneBy',
          maxSelect: 1,
          minSelect: 0,
          name: 'undoneBy',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
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
      id: 'pbc_contact_merge_history',
      indexes: [
        'CREATE INDEX idx_cmh_event ON contact_merge_history (eventId)',
        'CREATE INDEX idx_cmh_survivor ON contact_merge_history (survivorContactId)',
        'CREATE INDEX idx_cmh_merged ON contact_merge_history (mergedContactId)',
        'CREATE INDEX idx_cmh_created ON contact_merge_history (created)'
      ],
      name: 'contact_merge_history',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_contact_merge_history')
    return app.delete(collection)
  }
)
