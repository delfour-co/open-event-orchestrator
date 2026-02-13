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
          autogeneratePattern: '',
          hidden: false,
          id: 'targetFieldId',
          max: 100,
          min: 1,
          name: 'targetFieldId',
          pattern: '',
          presentable: true,
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
          id: 'conditions',
          maxSize: 50000,
          name: 'conditions',
          presentable: false,
          required: true,
          system: false,
          type: 'json'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'conditionLogic',
          max: 3,
          min: 2,
          name: 'conditionLogic',
          pattern: '^(AND|OR)$',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
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
          id: 'order',
          max: null,
          min: 0,
          name: 'order',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
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
      id: 'pbc_3605007360',
      indexes: [
        'CREATE INDEX `idx_field_condition_rules_edition` ON `field_condition_rules` (`editionId`)',
        'CREATE INDEX `idx_field_condition_rules_target` ON `field_condition_rules` (`editionId`, `targetFieldId`)'
      ],
      listRule: '',
      name: 'field_condition_rules',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3605007360')

    return app.delete(collection)
  }
)
