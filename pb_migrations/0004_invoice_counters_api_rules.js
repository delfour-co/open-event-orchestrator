/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Set API rules on invoice_counters collection
 * to allow server-side access (list, view, create, update).
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('invoice_counters')
    collection.listRule = ''
    collection.viewRule = ''
    collection.createRule = ''
    collection.updateRule = ''
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoice_counters')
    collection.listRule = null
    collection.viewRule = null
    collection.createRule = null
    collection.updateRule = null
    app.save(collection)
  }
)
