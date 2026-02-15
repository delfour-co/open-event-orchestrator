/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
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
          collectionId: 'pbc_1587547591',
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
      indexes: ['CREATE UNIQUE INDEX idx_feedback_settings_edition ON feedback_settings (editionId)'],
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_feedback_settings')
    return app.delete(collection)
  }
)
