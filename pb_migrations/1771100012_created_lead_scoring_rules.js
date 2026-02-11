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
          id: 'eventId',
          max: 0,
          min: 0,
          name: 'eventId',
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
          id: 'name',
          max: 100,
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
          hidden: false,
          id: 'action',
          maxSelect: 1,
          name: 'action',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'email_opened',
            'email_clicked',
            'ticket_purchased',
            'ticket_checked_in',
            'talk_submitted',
            'talk_accepted',
            'segment_joined',
            'inactivity',
            'custom'
          ]
        },
        {
          hidden: false,
          id: 'points',
          max: 1000,
          min: -1000,
          name: 'points',
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'inactivityDays',
          max: 365,
          min: 1,
          name: 'inactivityDays',
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'isActive',
          name: 'isActive',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
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
      id: 'pbc_scoring_rules',
      indexes: ['CREATE INDEX idx_scoring_rules_event ON lead_scoring_rules (eventId)'],
      listRule: '',
      name: 'lead_scoring_rules',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_scoring_rules')

    return app.delete(collection)
  }
)
