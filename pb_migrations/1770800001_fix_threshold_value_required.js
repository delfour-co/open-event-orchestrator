/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('alert_thresholds')

    // Fix thresholdValue field - make it not required since 0 is a valid value
    // PocketBase treats 0 as "blank" for required number fields
    const thresholdValueField = collection.fields.getByName('thresholdValue')
    if (thresholdValueField) {
      thresholdValueField.required = false
    }

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('alert_thresholds')

    // Restore required constraint
    const thresholdValueField = collection.fields.getByName('thresholdValue')
    if (thresholdValueField) {
      thresholdValueField.required = true
    }

    return app.save(collection)
  }
)
