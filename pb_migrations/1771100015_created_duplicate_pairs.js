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
          cascadeDelete: true,
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'contactId1',
          maxSelect: 1,
          minSelect: 1,
          name: 'contactId1',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'contactId2',
          maxSelect: 1,
          minSelect: 1,
          name: 'contactId2',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'matchType',
          maxSelect: 1,
          name: 'matchType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['exact_email', 'similar_name', 'similar_combined']
        },
        {
          hidden: false,
          id: 'confidenceScore',
          max: 100,
          min: 0,
          name: 'confidenceScore',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
          values: ['pending', 'merged', 'dismissed']
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'mergedContactId',
          maxSelect: 1,
          minSelect: 0,
          name: 'mergedContactId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'dismissedBy',
          maxSelect: 1,
          minSelect: 0,
          name: 'dismissedBy',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'dismissedAt',
          max: '',
          min: '',
          name: 'dismissedAt',
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
      id: 'pbc_duplicate_pairs',
      indexes: [
        'CREATE INDEX idx_duplicate_pairs_event ON duplicate_pairs (eventId)',
        'CREATE INDEX idx_duplicate_pairs_contact1 ON duplicate_pairs (contactId1)',
        'CREATE INDEX idx_duplicate_pairs_contact2 ON duplicate_pairs (contactId2)',
        'CREATE INDEX idx_duplicate_pairs_status ON duplicate_pairs (status)',
        'CREATE UNIQUE INDEX idx_duplicate_pairs_unique ON duplicate_pairs (contactId1, contactId2)'
      ],
      name: 'duplicate_pairs',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_duplicate_pairs')
    return app.delete(collection)
  }
)
