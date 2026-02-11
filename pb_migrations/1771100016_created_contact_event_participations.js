/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      id: 'contact_event_participations',
      name: 'contact_event_participations',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'contactid',
          name: 'contactId',
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
          id: 'editionid',
          name: 'editionId',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'editions',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: null
          }
        },
        {
          system: false,
          id: 'participationtype',
          name: 'participationType',
          type: 'select',
          required: true,
          options: {
            maxSelect: 1,
            values: [
              'registered',
              'ticket_purchased',
              'checked_in',
              'talk_submitted',
              'talk_accepted',
              'talk_rejected',
              'speaker',
              'volunteer',
              'sponsor_contact'
            ]
          }
        },
        {
          system: false,
          id: 'relatedentityid',
          name: 'relatedEntityId',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'relatedentitytype',
          name: 'relatedEntityType',
          type: 'text',
          required: false,
          options: {
            min: null,
            max: 50,
            pattern: ''
          }
        },
        {
          system: false,
          id: 'metadata',
          name: 'metadata',
          type: 'json',
          required: false,
          options: {
            maxSize: 10000
          }
        },
        {
          system: false,
          id: 'occurredat',
          name: 'occurredAt',
          type: 'date',
          required: true,
          options: {}
        }
      ],
      indexes: [
        'CREATE INDEX `idx_cep_contact` ON `contact_event_participations` (`contactId`)',
        'CREATE INDEX `idx_cep_event` ON `contact_event_participations` (`eventId`)',
        'CREATE INDEX `idx_cep_edition` ON `contact_event_participations` (`editionId`)',
        'CREATE INDEX `idx_cep_type` ON `contact_event_participations` (`participationType`)',
        'CREATE INDEX `idx_cep_occurred` ON `contact_event_participations` (`occurredAt`)'
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
    const collection = app.findCollectionByNameOrId('contact_event_participations')
    return app.delete(collection)
  }
)
