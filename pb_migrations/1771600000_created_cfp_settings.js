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
          id: 'cfpOpenDate',
          max: '',
          min: '',
          name: 'cfpOpenDate',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'cfpCloseDate',
          max: '',
          min: '',
          name: 'cfpCloseDate',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'introText',
          max: 5000,
          min: 0,
          name: 'introText',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'maxSubmissionsPerSpeaker',
          max: 50,
          min: 1,
          name: 'maxSubmissionsPerSpeaker',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'requireAbstract',
          name: 'requireAbstract',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'requireDescription',
          name: 'requireDescription',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'allowCoSpeakers',
          name: 'allowCoSpeakers',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'anonymousReview',
          name: 'anonymousReview',
          presentable: false,
          required: false,
          system: false,
          type: 'bool'
        },
        {
          hidden: false,
          id: 'revealSpeakersAfterDecision',
          name: 'revealSpeakersAfterDecision',
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
      id: 'pbc_2176234591',
      indexes: ['CREATE UNIQUE INDEX `idx_cfp_settings_edition` ON `cfp_settings` (`editionId`)'],
      listRule: '',
      name: 'cfp_settings',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2176234591')

    return app.delete(collection)
  }
)
