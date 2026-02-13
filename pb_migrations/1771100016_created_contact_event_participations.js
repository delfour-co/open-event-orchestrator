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
          collectionId: 'pbc_1930317162',
          hidden: false,
          id: 'contactId',
          maxSelect: 1,
          minSelect: 1,
          name: 'contactId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
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
          collectionId: 'pbc_3605007359',
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 1,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'participationType',
          maxSelect: 1,
          name: 'participationType',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
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
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'relatedEntityId',
          max: 50,
          min: 0,
          name: 'relatedEntityId',
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
          id: 'relatedEntityType',
          max: 50,
          min: 0,
          name: 'relatedEntityType',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'metadata',
          maxSize: 10000,
          name: 'metadata',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'occurredAt',
          max: '',
          min: '',
          name: 'occurredAt',
          presentable: false,
          required: true,
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
      id: 'pbc_contact_event_participations',
      indexes: [
        'CREATE INDEX idx_cep_contact ON contact_event_participations (contactId)',
        'CREATE INDEX idx_cep_event ON contact_event_participations (eventId)',
        'CREATE INDEX idx_cep_edition ON contact_event_participations (editionId)',
        'CREATE INDEX idx_cep_type ON contact_event_participations (participationType)',
        'CREATE INDEX idx_cep_occurred ON contact_event_participations (occurredAt)'
      ],
      name: 'contact_event_participations',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_contact_event_participations')
    return app.delete(collection)
  }
)
