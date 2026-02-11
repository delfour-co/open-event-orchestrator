/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'contact_merge_history',
      name: 'contact_merge_history',
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
          id: 'survivorcontactid',
          name: 'survivorContactId',
          type: 'relation',
          required: true,
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
          id: 'mergedcontactid',
          name: 'mergedContactId',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 50,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'survivordata',
          name: 'survivorData',
          type: 'json',
          required: true,
          options: {
            maxSize: 50000
          }
        },
        {
          system: false,
          id: 'mergeddata',
          name: 'mergedData',
          type: 'json',
          required: true,
          options: {
            maxSize: 50000
          }
        },
        {
          system: false,
          id: 'mergedecisions',
          name: 'mergeDecisions',
          type: 'json',
          required: true,
          options: {
            maxSize: 10000
          }
        },
        {
          system: false,
          id: 'mergedby',
          name: 'mergedBy',
          type: 'relation',
          required: true,
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
          id: 'undone',
          name: 'undone',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'undoneat',
          name: 'undoneAt',
          type: 'date',
          required: false,
          options: {}
        },
        {
          system: false,
          id: 'undoneby',
          name: 'undoneBy',
          type: 'relation',
          required: false,
          options: {
            collectionId: 'users',
            cascadeDelete: false,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        }
      ],
      indexes: [
        'CREATE INDEX `idx_cmh_event` ON `contact_merge_history` (`eventId`)',
        'CREATE INDEX `idx_cmh_survivor` ON `contact_merge_history` (`survivorContactId`)',
        'CREATE INDEX `idx_cmh_merged` ON `contact_merge_history` (`mergedContactId`)',
        'CREATE INDEX `idx_cmh_created` ON `contact_merge_history` (`created`)'
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
    const collection = app.findCollectionByNameOrId('contact_merge_history')
    return app.delete(collection)
  }
)
