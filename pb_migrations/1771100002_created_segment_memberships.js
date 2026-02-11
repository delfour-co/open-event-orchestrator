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
          id: 'segmentId',
          max: 0,
          min: 0,
          name: 'segmentId',
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
          id: 'joinedAt',
          max: '',
          min: '',
          name: 'joinedAt',
          presentable: false,
          required: true,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'leftAt',
          max: '',
          min: '',
          name: 'leftAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
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
        }
      ],
      id: 'pbc_segment_memberships',
      indexes: [
        'CREATE INDEX idx_segment_memberships_segment ON segment_memberships (segmentId)',
        'CREATE INDEX idx_segment_memberships_contact ON segment_memberships (contactId)',
        'CREATE INDEX idx_segment_memberships_active ON segment_memberships (segmentId, isActive)',
        'CREATE UNIQUE INDEX idx_segment_memberships_unique ON segment_memberships (segmentId, contactId, isActive) WHERE isActive = true'
      ],
      listRule: '',
      name: 'segment_memberships',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_segment_memberships')

    return app.delete(collection)
  }
)
