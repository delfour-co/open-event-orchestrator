/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'duplicate_pairs',
      name: 'duplicate_pairs',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'eventid',
          name: 'eventId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'contactid1',
          name: 'contactId1',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'contacts',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'contactid2',
          name: 'contactId2',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'contacts',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'matchtype',
          name: 'matchType',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['exact_email', 'similar_name', 'similar_combined']
          }
        },
        {
          system: false,
          id: 'confidencescore',
          name: 'confidenceScore',
          type: 'number',
          required: true,
          options: {
            min: 0,
            max: 100,
            noDecimal: true
          }
        },
        {
          system: false,
          id: 'status',
          name: 'status',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: ['pending', 'merged', 'dismissed']
          }
        },
        {
          system: false,
          id: 'mergedcontactid',
          name: 'mergedContactId',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'contacts',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'dismissedby',
          name: 'dismissedBy',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'users',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'dismissedat',
          name: 'dismissedAt',
          type: 'date',
          required: false,
          options: {}
        }
      ],
      indexes: [
        'CREATE INDEX `idx_duplicate_pairs_event` ON `duplicate_pairs` (`eventId`)',
        'CREATE INDEX `idx_duplicate_pairs_contact1` ON `duplicate_pairs` (`contactId1`)',
        'CREATE INDEX `idx_duplicate_pairs_contact2` ON `duplicate_pairs` (`contactId2`)',
        'CREATE INDEX `idx_duplicate_pairs_status` ON `duplicate_pairs` (`status`)',
        'CREATE UNIQUE INDEX `idx_duplicate_pairs_unique` ON `duplicate_pairs` (`contactId1`, `contactId2`)'
      ],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      options: {}
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('duplicate_pairs')
    return app.delete(collection)
  }
)
