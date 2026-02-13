/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1930317162')

    // Add double opt-in status field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'emailStatus',
        maxSelect: 1,
        name: 'emailStatus',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['pending', 'confirmed', 'active', 'unsubscribed']
      })
    )

    // Add confirmation token field (for double opt-in)
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'confirmationToken',
        max: 0,
        min: 0,
        name: 'confirmationToken',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    // Add confirmation token expiration
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'confirmationExpiresAt',
        max: '',
        min: '',
        name: 'confirmationExpiresAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add confirmed at timestamp
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'confirmedAt',
        max: '',
        min: '',
        name: 'confirmedAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add confirmation IP address for audit
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'confirmationIpAddress',
        max: 0,
        min: 0,
        name: 'confirmationIpAddress',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    // Add last reminder sent timestamp
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'lastReminderSentAt',
        max: '',
        min: '',
        name: 'lastReminderSentAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add reminder count
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'reminderCount',
        max: 10,
        min: 0,
        name: 'reminderCount',
        presentable: false,
        required: false,
        system: false,
        type: 'number'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1930317162')

    collection.fields.removeById('emailStatus')
    collection.fields.removeById('confirmationToken')
    collection.fields.removeById('confirmationExpiresAt')
    collection.fields.removeById('confirmedAt')
    collection.fields.removeById('confirmationIpAddress')
    collection.fields.removeById('lastReminderSentAt')
    collection.fields.removeById('reminderCount')

    return app.save(collection)
  }
)
