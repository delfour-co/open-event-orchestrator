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
          autogeneratePattern: '',
          hidden: false,
          id: 'campaignId',
          max: 0,
          min: 0,
          name: 'campaignId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'contactId',
          max: 0,
          min: 0,
          name: 'contactId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
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
          values: ['opened', 'clicked', 'bounced', 'unsubscribed', 'complained']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'url',
          max: 0,
          min: 0,
          name: 'url',
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
          id: 'linkId',
          max: 0,
          min: 0,
          name: 'linkId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'bounceType',
          maxSelect: 1,
          name: 'bounceType',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['hard', 'soft', 'unknown']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'bounceReason',
          max: 0,
          min: 0,
          name: 'bounceReason',
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
          id: 'ipAddress',
          max: 0,
          min: 0,
          name: 'ipAddress',
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
          id: 'userAgent',
          max: 0,
          min: 0,
          name: 'userAgent',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'timestamp',
          max: '',
          min: '',
          name: 'timestamp',
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
        }
      ],
      id: 'pbc_email_events',
      indexes: [
        'CREATE INDEX idx_email_events_campaign ON email_events (campaignId)',
        'CREATE INDEX idx_email_events_contact ON email_events (contactId)',
        'CREATE INDEX idx_email_events_type ON email_events (type)',
        'CREATE INDEX idx_email_events_campaign_type ON email_events (campaignId, type)',
        'CREATE INDEX idx_email_events_campaign_contact ON email_events (campaignId, contactId)'
      ],
      listRule: '',
      name: 'email_events',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_email_events')

    return app.delete(collection)
  }
)
