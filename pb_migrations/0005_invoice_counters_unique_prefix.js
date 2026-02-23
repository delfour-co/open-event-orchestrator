/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Update unique index on invoice_counters to include prefix,
 * allowing separate counter rows for invoices (F) and credit notes (AV).
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('invoice_counters')
    collection.indexes = [
      'CREATE UNIQUE INDEX idx_invoice_counters_org_prefix ON invoice_counters (organizationId, prefix)'
    ]
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('invoice_counters')
    collection.indexes = [
      'CREATE UNIQUE INDEX idx_invoice_counters_org ON invoice_counters (organizationId)'
    ]
    app.save(collection)
  }
)
