/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('contacts')

    // Add hard bounce count field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'hardBounceCount',
        max: null,
        min: 0,
        name: 'hardBounceCount',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    // Add soft bounce count field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'softBounceCount',
        max: null,
        min: 0,
        name: 'softBounceCount',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    // Add last bounce date field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'lastBounceAt',
        max: '',
        min: '',
        name: 'lastBounceAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add suppressed flag
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'isSuppressed',
        name: 'isSuppressed',
        presentable: false,
        required: false,
        system: false,
        type: 'bool'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contacts')

    collection.fields.removeById('hardBounceCount')
    collection.fields.removeById('softBounceCount')
    collection.fields.removeById('lastBounceAt')
    collection.fields.removeById('isSuppressed')

    return app.save(collection)
  }
)
