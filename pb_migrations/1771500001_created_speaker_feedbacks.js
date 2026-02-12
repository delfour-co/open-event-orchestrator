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
          collectionId: 'pbc_3611325497',
          hidden: false,
          id: 'talkId',
          maxSelect: 1,
          minSelect: 0,
          name: 'talkId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_speakers',
          hidden: false,
          id: 'speakerId',
          maxSelect: 1,
          minSelect: 0,
          name: 'speakerId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_feedback_templates',
          hidden: false,
          id: 'templateId',
          maxSelect: 1,
          minSelect: 0,
          name: 'templateId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'subject',
          max: 200,
          min: 1,
          name: 'subject',
          pattern: '',
          presentable: true,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'body',
          maxSize: 50000,
          name: 'body',
          presentable: false,
          required: true,
          system: false,
          type: 'editor'
        },
        {
          hidden: false,
          id: 'sentAt',
          max: '',
          min: '',
          name: 'sentAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: true,
          required: true,
          system: false,
          type: 'select',
          values: ['draft', 'sent', 'failed']
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'error',
          max: 2000,
          min: 0,
          name: 'error',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          cascadeDelete: false,
          collectionId: '_pb_users_auth_',
          hidden: false,
          id: 'createdBy',
          maxSelect: 1,
          minSelect: 0,
          name: 'createdBy',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
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
      id: 'pbc_speaker_feedbacks',
      indexes: [
        'CREATE INDEX idx_speaker_feedbacks_talk ON speaker_feedbacks (talkId)',
        'CREATE INDEX idx_speaker_feedbacks_speaker ON speaker_feedbacks (speakerId)',
        'CREATE INDEX idx_speaker_feedbacks_status ON speaker_feedbacks (status)',
        'CREATE UNIQUE INDEX idx_speaker_feedbacks_talk_speaker ON speaker_feedbacks (talkId, speakerId)'
      ],
      name: 'speaker_feedbacks',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_speaker_feedbacks')

    return app.delete(collection)
  }
)
