/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2184447689')

    // Add tracking configuration fields
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'enableOpenTracking',
        name: 'enableOpenTracking',
        presentable: false,
        required: false,
        system: false,
        type: 'bool'
      })
    )

    collection.fields.add(
      new Field({
        hidden: false,
        id: 'enableClickTracking',
        name: 'enableClickTracking',
        presentable: false,
        required: false,
        system: false,
        type: 'bool'
      })
    )

    // Add tracking stats fields
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'totalOpened',
        max: null,
        min: null,
        name: 'totalOpened',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    collection.fields.add(
      new Field({
        hidden: false,
        id: 'totalClicked',
        max: null,
        min: null,
        name: 'totalClicked',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    collection.fields.add(
      new Field({
        hidden: false,
        id: 'uniqueOpens',
        max: null,
        min: null,
        name: 'uniqueOpens',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    collection.fields.add(
      new Field({
        hidden: false,
        id: 'uniqueClicks',
        max: null,
        min: null,
        name: 'uniqueClicks',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2184447689')

    collection.fields.removeById('enableOpenTracking')
    collection.fields.removeById('enableClickTracking')
    collection.fields.removeById('totalOpened')
    collection.fields.removeById('totalClicked')
    collection.fields.removeById('uniqueOpens')
    collection.fields.removeById('uniqueClicks')

    return app.save(collection)
  }
)
