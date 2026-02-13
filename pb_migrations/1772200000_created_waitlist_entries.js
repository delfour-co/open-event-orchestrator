/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create waitlist_entries collection
 *
 * Manages waitlist entries for sold-out ticket types.
 * Supports FIFO queue with position tracking.
 */
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '',
      deleteRule: '',
      fields: [
        {
          autogeneratePattern: '[a-z0-9]{15}',
          hidden: false,
          id: 'text3208210256',
          max: 15,
          min: 15,
          name: 'id',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: 'text'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_3605007359', // editions
          hidden: false,
          id: 'editionId',
          maxSelect: 1,
          minSelect: 1,
          name: 'editionId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          cascadeDelete: true,
          collectionId: 'pbc_647540413', // ticket_types
          hidden: false,
          id: 'ticketTypeId',
          maxSelect: 1,
          minSelect: 1,
          name: 'ticketTypeId',
          presentable: false,
          required: true,
          system: false,
          type: 'relation'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'email',
          max: 254,
          min: 1,
          name: 'email',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'email'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'firstName',
          max: 50,
          min: 1,
          name: 'firstName',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'lastName',
          max: 50,
          min: 1,
          name: 'lastName',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: 'text'
        },
        {
          autogeneratePattern: '',
          hidden: false,
          id: 'phone',
          max: 20,
          min: 0,
          name: 'phone',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text'
        },
        {
          hidden: false,
          id: 'quantity',
          max: 10,
          min: 1,
          name: 'quantity',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'status',
          maxSelect: 1,
          name: 'status',
          presentable: false,
          required: true,
          system: false,
          type: 'select',
          values: ['waiting', 'notified', 'purchased', 'expired', 'cancelled']
        },
        {
          hidden: false,
          id: 'position',
          max: null,
          min: 1,
          name: 'position',
          onlyInt: true,
          presentable: false,
          required: true,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'notifiedAt',
          max: '',
          min: '',
          name: 'notifiedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'purchaseWindowEnd',
          max: '',
          min: '',
          name: 'purchaseWindowEnd',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          hidden: false,
          id: 'purchasedAt',
          max: '',
          min: '',
          name: 'purchasedAt',
          presentable: false,
          required: false,
          system: false,
          type: 'date'
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_3527180448', // orders
          hidden: false,
          id: 'orderId',
          maxSelect: 1,
          minSelect: 0,
          name: 'orderId',
          presentable: false,
          required: false,
          system: false,
          type: 'relation'
        },
        {
          hidden: false,
          id: 'metadata',
          maxSize: 10000,
          name: 'metadata',
          presentable: false,
          required: false,
          system: false,
          type: 'json'
        },
        {
          hidden: false,
          id: 'created',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate'
        },
        {
          hidden: false,
          id: 'updated',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate'
        }
      ],
      id: 'pbc_waitlist_entries',
      indexes: [
        'CREATE INDEX `idx_waitlist_edition` ON `waitlist_entries` (`editionId`)',
        'CREATE INDEX `idx_waitlist_ticket_type` ON `waitlist_entries` (`ticketTypeId`)',
        'CREATE INDEX `idx_waitlist_email` ON `waitlist_entries` (`email`)',
        'CREATE INDEX `idx_waitlist_status` ON `waitlist_entries` (`status`)',
        'CREATE INDEX `idx_waitlist_position` ON `waitlist_entries` (`ticketTypeId`, `position`)'
      ],
      listRule: '',
      name: 'waitlist_entries',
      system: false,
      type: 'base',
      updateRule: '',
      viewRule: ''
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_waitlist_entries')
    return app.delete(collection)
  }
)
