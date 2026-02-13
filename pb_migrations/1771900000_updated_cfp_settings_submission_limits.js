/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('cfp_settings')

    // Add separate co-speaker submission limit
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'maxSubmissionsPerCoSpeaker',
        max: 50,
        min: 1,
        name: 'maxSubmissionsPerCoSpeaker',
        onlyInt: true,
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    // Add custom message when submission limit is reached
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'limitReachedMessage',
        max: 1000,
        min: 0,
        name: 'limitReachedMessage',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    // Add option to allow exception requests
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'allowLimitExceptionRequest',
        name: 'allowLimitExceptionRequest',
        presentable: false,
        required: false,
        system: false,
        type: 'bool'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('cfp_settings')

    collection.fields.removeById('maxSubmissionsPerCoSpeaker')
    collection.fields.removeById('limitReachedMessage')
    collection.fields.removeById('allowLimitExceptionRequest')

    return app.save(collection)
  }
)
