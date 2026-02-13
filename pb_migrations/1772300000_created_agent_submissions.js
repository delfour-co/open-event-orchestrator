/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create agent_submissions collection
 *
 * Tracks submissions made on behalf of speakers by organizers.
 * Stores validation status and notification history.
 */
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
          collectionId: 'pbc_3660498186', // talks (assuming this ID, update if different)
          hidden: false,
          id: 'talkId',
          maxSelect: 1,
          minSelect: 1,
          name: 'talkId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_1636713223', // speakers
          hidden: false,
          id: 'speakerId',
          maxSelect: 1,
          minSelect: 1,
          name: 'speakerId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_', // users
          hidden: false,
          id: 'submittedBy',
          maxSelect: 1,
          minSelect: 1,
          name: 'submittedBy',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'submittedByName',
          max: 100,
          min: 1,
          name: 'submittedByName',
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
          id: 'submittedByEmail',
          max: 254,
          min: 1,
          name: 'submittedByEmail',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'email'
        },
        {
          hidden: false,
          id: 'origin',
          maxSelect: 1,
          name: 'origin',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['speaker', 'organizer', 'import', 'invitation']
        },
        {
          hidden: false,
          id: 'validationStatus',
          maxSelect: 1,
          name: 'validationStatus',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['pending', 'validated', 'rejected', 'expired']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'validationToken',
          max: 32,
          min: 32,
          name: 'validationToken',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'validationExpiresAt',
          max: '',
          min: '',
          name: 'validationExpiresAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'validatedAt',
          max: '',
          min: '',
          name: 'validatedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'validationNotes',
          max: 500,
          min: 0,
          name: 'validationNotes',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'notificationSentAt',
          max: '',
          min: '',
          name: 'notificationSentAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'reminderSentAt',
          max: '',
          min: '',
          name: 'reminderSentAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'originalContent',
          maxSize: 50000,
          name: 'originalContent',
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
      id: 'pbc_agent_submissions',
      indexes: [
        'CREATE INDEX `idx_agent_submission_talk` ON `agent_submissions` (`talkId`)',
        'CREATE INDEX `idx_agent_submission_speaker` ON `agent_submissions` (`speakerId`)',
        'CREATE INDEX `idx_agent_submission_status` ON `agent_submissions` (`validationStatus`)',
        'CREATE UNIQUE INDEX `idx_agent_submission_token` ON `agent_submissions` (`validationToken`)'
      ],
      listRule: '',
      name: 'agent_submissions',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_agent_submissions')
    return app.delete(collection)
  }
)
