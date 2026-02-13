/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Add streaming fields to sessions
 *
 * Adds support for hybrid/online events with streaming configuration:
 * - format: Session format (in_person, online, hybrid)
 * - streamingPlatform: Streaming platform (youtube, twitch, zoom, etc.)
 * - streamingUrl: URL of the stream
 * - streamingAccessLevel: Access control (public, registered, password, unique)
 * - streamingPassword: Password for password-protected streams
 * - streamingAllowEmbed: Whether to allow embedding the player
 * - streamingScheduledStart: Scheduled start time for countdown
 * - streamingMeetingId: Meeting ID (for Zoom, Teams, etc.)
 * - streamingPasscode: Meeting passcode
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // Add format field (in_person, online, hybrid)
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'format',
        maxSelect: 1,
        name: 'format',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['in_person', 'online', 'hybrid']
      })
    )

    // Add streaming platform field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'streamingPlatform',
        maxSelect: 1,
        name: 'streamingPlatform',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['youtube', 'twitch', 'zoom', 'teams', 'meet', 'webex', 'vimeo', 'custom']
      })
    )

    // Add streaming URL field
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'streamingUrl',
        max: 500,
        min: 0,
        name: 'streamingUrl',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'url'
      })
    )

    // Add streaming access level field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'streamingAccessLevel',
        maxSelect: 1,
        name: 'streamingAccessLevel',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['public', 'registered', 'password', 'unique']
      })
    )

    // Add streaming password field
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'streamingPassword',
        max: 100,
        min: 0,
        name: 'streamingPassword',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    // Add streaming allow embed field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'streamingAllowEmbed',
        name: 'streamingAllowEmbed',
        presentable: false,
        required: false,
        system: false,
        type: 'bool'
      })
    )

    // Add streaming scheduled start field
    collection.fields.add(
      new Field({
        hidden: false,
        id: 'streamingScheduledStart',
        max: '',
        min: '',
        name: 'streamingScheduledStart',
        presentable: false,
        required: false,
        system: false,
        type: 'date'
      })
    )

    // Add streaming meeting ID field
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'streamingMeetingId',
        max: 100,
        min: 0,
        name: 'streamingMeetingId',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    // Add streaming passcode field
    collection.fields.add(
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'streamingPasscode',
        max: 50,
        min: 0,
        name: 'streamingPasscode',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      })
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3660498186')

    // Remove fields in reverse order
    collection.fields.removeById('streamingPasscode')
    collection.fields.removeById('streamingMeetingId')
    collection.fields.removeById('streamingScheduledStart')
    collection.fields.removeById('streamingAllowEmbed')
    collection.fields.removeById('streamingPassword')
    collection.fields.removeById('streamingAccessLevel')
    collection.fields.removeById('streamingUrl')
    collection.fields.removeById('streamingPlatform')
    collection.fields.removeById('format')

    return app.save(collection)
  }
)
