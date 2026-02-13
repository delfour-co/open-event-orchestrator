/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1930317162')

    // Add lead score field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'leadScore',
        max: 100000,
        min: -100000,
        name: 'leadScore',
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    // Add lead score level (cold, warm, hot)
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'leadScoreLevel',
        maxSelect: 1,
        name: 'leadScoreLevel',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['cold', 'warm', 'hot']
      })
    )

    // Add last score update timestamp
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'leadScoreUpdatedAt',
        max: '',
        min: '',
        name: 'leadScoreUpdatedAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add last activity date for inactivity tracking
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'lastActivityAt',
        max: '',
        min: '',
        name: 'lastActivityAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1930317162')

    collection.fields.removeById('leadScore')
    collection.fields.removeById('leadScoreLevel')
    collection.fields.removeById('leadScoreUpdatedAt')
    collection.fields.removeById('lastActivityAt')

    return app.save(collection)
  }
)
