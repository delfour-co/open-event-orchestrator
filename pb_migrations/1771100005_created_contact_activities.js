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
          collectionId: 'pbc_contacts',
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
          cascadeDelete: false,
          collectionId: 'pbc_events',
          hidden: false,
          id: 'eventId',
          maxSelect: 1,
          minSelect: 0,
          name: 'eventId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_editions',
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'type',
          maxSelect: 1,
          name: 'type',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'email_sent',
            'email_opened',
            'email_clicked',
            'email_bounced',
            'email_unsubscribed',
            'ticket_purchased',
            'ticket_checked_in',
            'ticket_refunded',
            'talk_submitted',
            'talk_accepted',
            'talk_rejected',
            'consent_granted',
            'consent_revoked',
            'tag_added',
            'tag_removed',
            'contact_created',
            'contact_updated',
            'contact_imported',
            'contact_synced',
            'segment_joined',
            'segment_left'
          ]
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 0,
          min: 0,
          name: 'description',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'metadata',
          maxSize: 0,
          name: 'metadata',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
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
        }
      ],
      id: 'pbc_contact_activities',
      indexes: [
        'CREATE INDEX idx_contact_activities_contact ON contact_activities (contactId)',
        'CREATE INDEX idx_contact_activities_type ON contact_activities (type)',
        'CREATE INDEX idx_contact_activities_event ON contact_activities (eventId)',
        'CREATE INDEX idx_contact_activities_edition ON contact_activities (editionId)',
        'CREATE INDEX idx_contact_activities_contact_type ON contact_activities (contactId, type)',
        'CREATE INDEX idx_contact_activities_created ON contact_activities (created DESC)'
      ],
      listRule: '',
      name: 'contact_activities',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_contact_activities')

    return app.delete(collection)
  }
)
