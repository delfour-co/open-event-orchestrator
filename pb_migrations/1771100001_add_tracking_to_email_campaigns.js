/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2184447689')

    // Add tracking configuration fields
    collection.fields.push({
      hidden: false,
      id: 'enableOpenTracking',
      name: 'enableOpenTracking',
      presentable: false,
      required: false,
      system: false,
      type: 'bool'
    })

    collection.fields.push({
      hidden: false,
      id: 'enableClickTracking',
      name: 'enableClickTracking',
      presentable: false,
      required: false,
      system: false,
      type: 'bool'
    })

    // Add tracking stats fields
    collection.fields.push({
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

    collection.fields.push({
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

    collection.fields.push({
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

    collection.fields.push({
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

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2184447689')

    const fieldsToRemove = [
      'enableOpenTracking',
      'enableClickTracking',
      'totalOpened',
      'totalClicked',
      'uniqueOpens',
      'uniqueClicks'
    ]

    collection.fields = collection.fields.filter((field) => !fieldsToRemove.includes(field.name))

    return app.save(collection)
  }
)
