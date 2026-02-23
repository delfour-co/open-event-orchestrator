/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Change budget_invoices.file from text to file type
 * so that PocketBase actually stores uploaded PDF files.
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_invoices')

    // Remove the old text field
    const oldField = collection.fields.getByName('file')
    if (oldField) collection.fields.removeById(oldField.id)

    // Add the correct file field
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'file',
          id: 'invoice_file',
          name: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          presentable: false,
          protected: false,
          required: false,
          thumbs: null
        }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_invoices')

    // Remove the file field
    const fileField = collection.fields.getByName('file')
    if (fileField) collection.fields.removeById(fileField.id)

    // Restore the old text field
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        {
          type: 'text',
          id: 'file',
          name: 'file',
          required: false
        }
      ])
    )
    app.save(collection)
  }
)
