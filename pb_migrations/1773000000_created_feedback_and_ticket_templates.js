/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create feedback and ticket template collections
 *
 * Creates:
 * - session_feedback: Attendee ratings for sessions
 * - event_feedback: General feedback and problem reports
 * - feedback_settings: Per-edition feedback configuration
 * - ticket_templates: Custom ticket design per edition
 */
migrate(
  (app) => {
    // Find existing collections for relations
    const sessionsCollection = app.findCollectionByNameOrId('sessions')
    const editionsCollection = app.findCollectionByNameOrId('editions')

    // 1. Create session_feedback collection
    const sessionFeedback = new Collection({
      id: 'pbc_session_feedback',
      name: 'session_feedback',
      type: 'base',
      system: false,
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
          collectionId: sessionsCollection.id,
          hidden: false,
          id: 'sessionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'sessionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'sf_userId',
          max: 100,
          min: 1,
          name: 'userId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'ratingMode',
          maxSelect: 1,
          name: 'ratingMode',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['stars', 'scale_10', 'thumbs', 'yes_no']
        },
        {
          hidden: false,
          id: 'numericValue',
          max: 10,
          min: 0,
          name: 'numericValue',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'sf_comment',
          max: 2000,
          min: 0,
          name: 'comment',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'autodate2990389176',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'autodate3332085495',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_session_user ON session_feedback (sessionId, userId)'],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: null,
      deleteRule: '@request.auth.id != ""'
    })
    app.save(sessionFeedback)

    // 2. Create event_feedback collection
    const eventFeedback = new Collection({
      id: 'pbc_event_feedback',
      name: 'event_feedback',
      type: 'base',
      system: false,
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
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'ef_editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'ef_userId',
          max: 100,
          min: 1,
          name: 'userId',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'feedbackType',
          maxSelect: 1,
          name: 'feedbackType',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['general', 'problem']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'ef_subject',
          max: 200,
          min: 0,
          name: 'subject',
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
          id: 'ef_message',
          max: 5000,
          min: 1,
          name: 'message',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'ef_status',
          maxSelect: 1,
          name: 'status',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['open', 'acknowledged', 'resolved', 'closed']
        },
        {
          hidden: false,
          id: 'autodate2990389177',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'autodate3332085496',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      indexes: [],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })
    app.save(eventFeedback)

    // 3. Create feedback_settings collection
    const feedbackSettings = new Collection({
      id: 'pbc_feedback_settings',
      name: 'feedback_settings',
      type: 'base',
      system: false,
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
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'fs_editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'sessionRatingEnabled',
          name: 'sessionRatingEnabled',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'sessionRatingMode',
          maxSelect: 1,
          name: 'sessionRatingMode',
          presentable: false,
          required: false,
          system: false,
          type: 'select',
          values: ['stars', 'scale_10', 'thumbs', 'yes_no']
        },
        {
          hidden: false,
          id: 'sessionCommentRequired',
          name: 'sessionCommentRequired',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'eventFeedbackEnabled',
          name: 'eventFeedbackEnabled',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'feedbackIntroText',
          max: 2000,
          min: 0,
          name: 'feedbackIntroText',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'autodate2990389178',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'autodate3332085497',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_feedback_settings_edition ON feedback_settings (editionId)'
      ],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })
    app.save(feedbackSettings)

    // 4. Create ticket_templates collection
    const ticketTemplates = new Collection({
      id: 'pbc_ticket_templates',
      name: 'ticket_templates',
      type: 'base',
      system: false,
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
          collectionId: editionsCollection.id,
          hidden: false,
          id: 'tt_editionId',
          maxSelect: 1,
          minSelect: 0,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'primaryColor',
          max: 7,
          min: 0,
          name: 'primaryColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'backgroundColor',
          max: 7,
          min: 0,
          name: 'backgroundColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'textColor',
          max: 7,
          min: 0,
          name: 'textColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'accentColor',
          max: 7,
          min: 0,
          name: 'accentColor',
          pattern: '^#[0-9A-Fa-f]{6}$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          exceptDomains: [],
          hidden: false,
          id: 'logoUrl',
          name: 'logoUrl',
          onlyDomains: [],
          presentable: false,
          required: false,
          system: false,
          type: 'url'
        },
        {
          hidden: false,
          id: 'logoFile',
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          name: 'logoFile',
          presentable: false,
          protected: false,
          required: false,
          system: false,
          thumbs: ['300x0'],
          type: 'file'
        },
        {
          hidden: false,
          id: 'showVenue',
          name: 'showVenue',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'showDate',
          name: 'showDate',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'showQrCode',
          name: 'showQrCode',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'customFooterText',
          max: 200,
          min: 0,
          name: 'customFooterText',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'autodate2990389179',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'autodate3332085498',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_ticket_templates_edition ON ticket_templates (editionId)'],
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })
    app.save(ticketTemplates)
  },
  (app) => {
    // Rollback: delete all 4 collections
    const collections = [
      'pbc_ticket_templates',
      'pbc_feedback_settings',
      'pbc_event_feedback',
      'pbc_session_feedback'
    ]
    for (const id of collections) {
      try {
        const collection = app.findCollectionByNameOrId(id)
        app.delete(collection)
      } catch (e) {
        // Collection may not exist
      }
    }
  }
)
