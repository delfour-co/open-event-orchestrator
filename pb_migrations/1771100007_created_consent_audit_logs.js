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
          id: 'consentId',
          max: 0,
          min: 0,
          name: 'consentId',
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
            'granted',
            'withdrawn',
            'confirmed',
            'unsubscribed',
            'preferences_updated',
            'data_exported',
            'data_deleted'
          ]
        },
        {
          hidden: false,
          id: 'consentType',
          maxSelect: 1,
          name: 'consentType',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: [
            'marketing_email',
            'newsletter',
            'event_updates',
            'partner_communications',
            'data_sharing',
            'analytics'
          ]
        },
        {
          hidden: false,
          id: 'source',
          maxSelect: 1,
          name: 'source',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: [
            'form',
            'import',
            'api',
            'manual',
            'preference_center',
            'unsubscribe_link',
            'double_opt_in',
            'gdpr_request'
          ]
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
      id: 'pbc_consent_audit',
      indexes: [
        'CREATE INDEX idx_consent_audit_contact ON consent_audit_logs (contactId)',
        'CREATE INDEX idx_consent_audit_action ON consent_audit_logs (action)',
        'CREATE INDEX idx_consent_audit_created ON consent_audit_logs (created)'
      ],
      listRule: '',
      name: 'consent_audit_logs',
      system: false,
      type: 'base',
      updateRule: null,
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_consent_audit')

    return app.delete(collection)
  }
)
