/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '',
      deleteRule: null,
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
          autogeneratePattern: '',
          hidden: false,
          id: 'ruleId',
          max: 0,
          min: 0,
          name: 'ruleId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
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
            'custom',
            'manual_adjustment'
          ]
        },
        {
          hidden: false,
          id: 'pointsChange',
          max: 1000,
          min: -1000,
          name: 'pointsChange',
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'previousScore',
          max: 100000,
          min: -100000,
          name: 'previousScore',
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'newScore',
          max: 100000,
          min: -100000,
          name: 'newScore',
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'description',
          max: 500,
          min: 0,
          name: 'description',
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
          maxSize: 2000000,
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
      id: 'pbc_score_history',
      indexes: [
        'CREATE INDEX idx_score_history_contact ON lead_score_history (contactId)',
        'CREATE INDEX idx_score_history_created ON lead_score_history (created)'
      ],
      listRule: '',
      name: 'lead_score_history',
      system: false,
      type: 'base',
      updateRule: null,
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_score_history')

    return app.delete(collection)
  }
)
