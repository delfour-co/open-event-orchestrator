/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('reimbursement_items')

    // Remove the old text field
    collection.fields.removeById('receipt')

    // Add the new file field
    collection.fields.addAt(
      5,
      new Field({
        hidden: false,
        id: 'receipt_file',
        maxSelect: 1,
        maxSize: 10485760, // 10MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        name: 'receipt',
        presentable: false,
        protected: false,
        required: false,
        system: false,
        thumbs: ['100x100'],
        type: 'file'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('reimbursement_items')

    // Remove the file field
    collection.fields.removeById('receipt_file')

    // Restore the text field
    collection.fields.addAt(
      5,
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'receipt',
        max: 0,
        min: 0,
        name: 'receipt',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    return app.save(collection)
  }
)
