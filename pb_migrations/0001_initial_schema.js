/// <reference path="../pb_data/types.d.ts" />
/**
 * Consolidated migration for Open Event Orchestrator
 * Generated: 2026-02-18T14:15:18.054Z
 *
 * This migration creates all 100 application collections in dependency order.
 */
migrate(
  (app) => {
    // users (update existing)
    const usersCol = app.findCollectionByNameOrId('users')
    const usersCustomFields = [
      {
        autogeneratePattern: '',
        hidden: false,
        id: 'text1579384326',
        max: 255,
        min: 0,
        name: 'name',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text'
      },
      {
        hidden: false,
        id: 'file376926767',
        maxSelect: 1,
        maxSize: 0,
        mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
        name: 'avatar',
        presentable: false,
        protected: false,
        required: false,
        system: false,
        thumbs: null,
        type: 'file'
      },
      {
        hidden: false,
        id: 'autodate2990389176',
        name: 'created',
        onCreate: true,
        onUpdate: false,
        presentable: false,
        system: false,
        type: 'autodate'
      },
      {
        hidden: false,
        id: 'autodate3332085495',
        name: 'updated',
        onCreate: true,
        onUpdate: true,
        presentable: false,
        system: false,
        type: 'autodate'
      },
      {
        hidden: false,
        id: 'role',
        maxSelect: 1,
        name: 'role',
        presentable: false,
        required: false,
        system: false,
        type: 'select',
        values: ['super_admin', 'org_admin', 'org_member', 'speaker', 'attendee']
      }
    ]
    for (const f of usersCustomFields) usersCol.fields.add(new Field(f))
    usersCol.listRule = '@request.auth.id != ""'
    usersCol.viewRule = '@request.auth.id != ""'
    usersCol.createRule = ''
    usersCol.updateRule = 'id = @request.auth.id'
    usersCol.deleteRule = 'id = @request.auth.id'
    app.save(usersCol)

    // app_settings
    app.save(
      new Collection({
        id: 'pbc_3126690926',
        name: 'app_settings',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'smtpHost',
            max: 0,
            min: 0,
            name: 'smtpHost',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'smtpPort',
            max: null,
            min: null,
            name: 'smtpPort',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'smtpUser',
            max: 0,
            min: 0,
            name: 'smtpUser',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'smtpPass',
            max: 0,
            min: 0,
            name: 'smtpPass',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'smtpFrom',
            max: 0,
            min: 0,
            name: 'smtpFrom',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'smtpEnabled',
            name: 'smtpEnabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // organizations
    app.save(
      new Collection({
        id: 'pbc_2873630990',
        name: 'organizations',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'slug',
            max: 0,
            min: 0,
            name: 'slug',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // events
    app.save(
      new Collection({
        id: 'pbc_1687431684',
        name: 'events',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'slug',
            max: 0,
            min: 0,
            name: 'slug',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY', 'INR', 'BRL']
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // editions
    app.save(
      new Collection({
        id: 'pbc_3605007359',
        name: 'editions',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'slug',
            max: 0,
            min: 0,
            name: 'slug',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'year',
            max: null,
            min: null,
            name: 'year',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'startDate',
            max: '',
            min: '',
            name: 'startDate',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'endDate',
            max: '',
            min: '',
            name: 'endDate',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'venue',
            max: 0,
            min: 0,
            name: 'venue',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'city',
            max: 0,
            min: 0,
            name: 'city',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'country',
            max: 0,
            min: 0,
            name: 'country',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['draft', 'published', 'archived']
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // orders
    app.save(
      new Collection({
        id: 'pbc_3527180448',
        name: 'orders',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'orderNumber',
            max: 0,
            min: 0,
            name: 'orderNumber',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'firstName',
            max: 0,
            min: 0,
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
            max: 0,
            min: 0,
            name: 'lastName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['pending', 'paid', 'cancelled', 'refunded']
          },
          {
            hidden: false,
            id: 'totalAmount',
            max: null,
            min: null,
            name: 'totalAmount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'stripeSessionId',
            max: 0,
            min: 0,
            name: 'stripeSessionId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'stripePaymentIntentId',
            max: 0,
            min: 0,
            name: 'stripePaymentIntentId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'paidAt',
            max: '',
            min: '',
            name: 'paidAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'cancelledAt',
            max: '',
            min: '',
            name: 'cancelledAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // ticket_types
    app.save(
      new Collection({
        id: 'pbc_647540413',
        name: 'ticket_types',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'price',
            max: null,
            min: null,
            name: 'price',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            hidden: false,
            id: 'quantity',
            max: null,
            min: null,
            name: 'quantity',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'quantitySold',
            max: null,
            min: null,
            name: 'quantitySold',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'salesStartDate',
            max: '',
            min: '',
            name: 'salesStartDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'salesEndDate',
            max: '',
            min: '',
            name: 'salesEndDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: null,
            name: 'order',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // billing_tickets
    app.save(
      new Collection({
        id: 'pbc_1361378225',
        name: 'billing_tickets',
        type: 'base',
        system: false,
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
            exceptDomains: null,
            hidden: false,
            id: 'attendeeEmail',
            name: 'attendeeEmail',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'attendeeFirstName',
            max: 0,
            min: 0,
            name: 'attendeeFirstName',
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
            id: 'attendeeLastName',
            max: 0,
            min: 0,
            name: 'attendeeLastName',
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
            id: 'ticketNumber',
            max: 0,
            min: 0,
            name: 'ticketNumber',
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
            id: 'qrCode',
            max: 0,
            min: 0,
            name: 'qrCode',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['valid', 'used', 'cancelled']
          },
          {
            hidden: false,
            id: 'checkedInAt',
            max: '',
            min: '',
            name: 'checkedInAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'checkedInBy',
            max: 0,
            min: 0,
            name: 'checkedInBy',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3527180448',
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
            cascadeDelete: false,
            collectionId: 'pbc_647540413',
            hidden: false,
            id: 'ticketTypeId',
            maxSelect: 1,
            minSelect: 0,
            name: 'ticketTypeId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // edition_budgets
    app.save(
      new Collection({
        id: 'pbc_2708044088',
        name: 'edition_budgets',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'totalBudget',
            max: null,
            min: null,
            name: 'totalBudget',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['draft', 'approved', 'closed']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // budget_categories
    app.save(
      new Collection({
        id: 'pbc_1899532601',
        name: 'budget_categories',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'plannedAmount',
            max: null,
            min: null,
            name: 'plannedAmount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2708044088',
            hidden: false,
            id: 'budgetId',
            maxSelect: 1,
            minSelect: 0,
            name: 'budgetId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // budget_transactions
    app.save(
      new Collection({
        id: 'pbc_1371503333',
        name: 'budget_transactions',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['expense', 'income']
          },
          {
            hidden: false,
            id: 'amount',
            max: null,
            min: null,
            name: 'amount',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
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
            id: 'vendor',
            max: 0,
            min: 0,
            name: 'vendor',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'invoiceNumber',
            max: 0,
            min: 0,
            name: 'invoiceNumber',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'date',
            max: '',
            min: '',
            name: 'date',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['pending', 'paid', 'cancelled']
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1899532601',
            hidden: false,
            id: 'categoryId',
            maxSelect: 1,
            minSelect: 0,
            name: 'categoryId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // budget_invoices
    app.save(
      new Collection({
        id: 'pbc_3551302563',
        name: 'budget_invoices',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'invoiceNumber',
            max: 0,
            min: 0,
            name: 'invoiceNumber',
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
            id: 'file',
            max: 0,
            min: 0,
            name: 'file',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'issueDate',
            max: '',
            min: '',
            name: 'issueDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'dueDate',
            max: '',
            min: '',
            name: 'dueDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'amount',
            max: null,
            min: null,
            name: 'amount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1371503333',
            hidden: false,
            id: 'transactionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'transactionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // budget_quotes
    app.save(
      new Collection({
        id: 'pbc_473232136',
        name: 'budget_quotes',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'quoteNumber',
            max: 0,
            min: 0,
            name: 'quoteNumber',
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
            id: 'vendor',
            max: 0,
            min: 0,
            name: 'vendor',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'vendorEmail',
            name: 'vendorEmail',
            onlyDomains: null,
            presentable: false,
            required: false,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'vendorAddress',
            max: 0,
            min: 0,
            name: 'vendorAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'items',
            maxSize: 2000000,
            name: 'items',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'totalAmount',
            max: null,
            min: null,
            name: 'totalAmount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['draft', 'sent', 'accepted', 'rejected', 'expired']
          },
          {
            hidden: false,
            id: 'validUntil',
            max: '',
            min: '',
            name: 'validUntil',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'sentAt',
            max: '',
            min: '',
            name: 'sentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1371503333',
            hidden: false,
            id: 'transactionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'transactionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // categories
    app.save(
      new Collection({
        id: 'pbc_3292755704',
        name: 'categories',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'color',
            max: 0,
            min: 0,
            name: 'color',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: null,
            name: 'order',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // formats
    app.save(
      new Collection({
        id: 'pbc_2632959446',
        name: 'formats',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'duration',
            max: null,
            min: null,
            name: 'duration',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: null,
            name: 'order',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // speakers
    app.save(
      new Collection({
        id: 'pbc_1636713223',
        name: 'speakers',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'firstName',
            max: 0,
            min: 0,
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
            max: 0,
            min: 0,
            name: 'lastName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bio',
            max: 0,
            min: 0,
            name: 'bio',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'company',
            max: 0,
            min: 0,
            name: 'company',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'jobTitle',
            max: 0,
            min: 0,
            name: 'jobTitle',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'photoUrl',
            name: 'photoUrl',
            onlyDomains: null,
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'twitter',
            max: 0,
            min: 0,
            name: 'twitter',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'github',
            max: 0,
            min: 0,
            name: 'github',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'linkedin',
            name: 'linkedin',
            onlyDomains: null,
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'city',
            max: 0,
            min: 0,
            name: 'city',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'country',
            max: 0,
            min: 0,
            name: 'country',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // talks
    app.save(
      new Collection({
        id: 'pbc_2355380017',
        name: 'talks',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'title',
            max: 0,
            min: 0,
            name: 'title',
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
            id: 'abstract',
            max: 0,
            min: 0,
            name: 'abstract',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'level',
            maxSelect: 1,
            name: 'level',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['beginner', 'intermediate', 'advanced']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'language',
            max: 0,
            min: 0,
            name: 'language',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: [
              'draft',
              'submitted',
              'under_review',
              'accepted',
              'rejected',
              'confirmed',
              'declined',
              'withdrawn'
            ]
          },
          {
            hidden: false,
            id: 'submittedAt',
            max: '',
            min: '',
            name: 'submittedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3292755704',
            hidden: false,
            id: 'categoryId',
            maxSelect: 1,
            minSelect: 0,
            name: 'categoryId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2632959446',
            hidden: false,
            id: 'formatId',
            maxSelect: 1,
            minSelect: 0,
            name: 'formatId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerIds',
            maxSelect: 10,
            minSelect: 0,
            name: 'speakerIds',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // comments
    app.save(
      new Collection({
        id: 'pbc_533777971',
        name: 'comments',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'content',
            max: 0,
            min: 0,
            name: 'content',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isInternal',
            name: 'isInternal',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2355380017',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 0,
            name: 'talkId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // consents
    app.save(
      new Collection({
        id: 'pbc_1184142718',
        name: 'consents',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['marketing_email', 'data_sharing', 'analytics']
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['granted', 'denied', 'withdrawn']
          },
          {
            hidden: false,
            id: 'grantedAt',
            max: '',
            min: '',
            name: 'grantedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'withdrawnAt',
            max: '',
            min: '',
            name: 'withdrawnAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'source',
            maxSelect: 1,
            name: 'source',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['form', 'import', 'api', 'manual']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ipAddress',
            max: 0,
            min: 0,
            name: 'ipAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'userAgent',
            max: 0,
            min: 0,
            name: 'userAgent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // contact_edition_links
    app.save(
      new Collection({
        id: 'pbc_432299422',
        name: 'contact_edition_links',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'editionId',
            max: 0,
            min: 0,
            name: 'editionId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'roles',
            maxSize: 2000000,
            name: 'roles',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'speakerId',
            max: 0,
            min: 0,
            name: 'speakerId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // contacts
    app.save(
      new Collection({
        id: 'pbc_1930317162',
        name: 'contacts',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'firstName',
            max: 0,
            min: 0,
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
            max: 0,
            min: 0,
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
            id: 'company',
            max: 0,
            min: 0,
            name: 'company',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'jobTitle',
            max: 0,
            min: 0,
            name: 'jobTitle',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'phone',
            max: 0,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'address',
            max: 0,
            min: 0,
            name: 'address',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bio',
            max: 0,
            min: 0,
            name: 'bio',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'photoUrl',
            max: 0,
            min: 0,
            name: 'photoUrl',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'twitter',
            max: 0,
            min: 0,
            name: 'twitter',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'linkedin',
            max: 0,
            min: 0,
            name: 'linkedin',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'github',
            max: 0,
            min: 0,
            name: 'github',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'city',
            max: 0,
            min: 0,
            name: 'city',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'country',
            max: 0,
            min: 0,
            name: 'country',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'source',
            maxSelect: 1,
            name: 'source',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['speaker', 'attendee', 'sponsor', 'manual', 'import']
          },
          {
            hidden: false,
            id: 'tags',
            maxSize: 2000000,
            name: 'tags',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'unsubscribeToken',
            max: 0,
            min: 0,
            name: 'unsubscribeToken',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            hidden: false,
            id: 'hardBounceCount',
            max: null,
            min: 0,
            name: 'hardBounceCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'softBounceCount',
            max: null,
            min: 0,
            name: 'softBounceCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'lastBounceAt',
            max: '',
            min: '',
            name: 'lastBounceAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'isSuppressed',
            name: 'isSuppressed',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'emailStatus',
            maxSelect: 1,
            name: 'emailStatus',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['pending', 'confirmed', 'active', 'unsubscribed']
          },
          {
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
          },
          {
            hidden: false,
            id: 'confirmationExpiresAt',
            max: '',
            min: '',
            name: 'confirmationExpiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'confirmedAt',
            max: '',
            min: '',
            name: 'confirmedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
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
          },
          {
            hidden: false,
            id: 'lastReminderSentAt',
            max: '',
            min: '',
            name: 'lastReminderSentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'reminderCount',
            max: 10,
            min: 0,
            name: 'reminderCount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'leadScore',
            max: 100000,
            min: -100000,
            name: 'leadScore',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'leadScoreLevel',
            maxSelect: 1,
            name: 'leadScoreLevel',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['cold', 'warm', 'hot']
          },
          {
            hidden: false,
            id: 'leadScoreUpdatedAt',
            max: '',
            min: '',
            name: 'leadScoreUpdatedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'lastActivityAt',
            max: '',
            min: '',
            name: 'lastActivityAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // email_campaigns
    app.save(
      new Collection({
        id: 'pbc_2184447689',
        name: 'email_campaigns',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'editionId',
            max: 0,
            min: 0,
            name: 'editionId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'templateId',
            max: 0,
            min: 0,
            name: 'templateId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'segmentId',
            max: 0,
            min: 0,
            name: 'segmentId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 0,
            min: 0,
            name: 'subject',
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
            id: 'bodyHtml',
            max: 0,
            min: 0,
            name: 'bodyHtml',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bodyText',
            max: 0,
            min: 0,
            name: 'bodyText',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['draft', 'scheduled', 'sending', 'sent', 'cancelled']
          },
          {
            hidden: false,
            id: 'scheduledAt',
            max: '',
            min: '',
            name: 'scheduledAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'sentAt',
            max: '',
            min: '',
            name: 'sentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'totalRecipients',
            max: null,
            min: null,
            name: 'totalRecipients',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'totalSent',
            max: null,
            min: null,
            name: 'totalSent',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'totalFailed',
            max: null,
            min: null,
            name: 'totalFailed',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            hidden: false,
            id: 'enableOpenTracking',
            name: 'enableOpenTracking',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'enableClickTracking',
            name: 'enableClickTracking',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
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
          },
          {
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
          },
          {
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
          },
          {
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
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // email_logs
    app.save(
      new Collection({
        id: 'pbc_2433341001',
        name: 'email_logs',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'submission_confirmed',
              'talk_accepted',
              'talk_rejected',
              'confirmation_reminder',
              'cfp_closing_reminder'
            ]
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'to',
            name: 'to',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 0,
            min: 0,
            name: 'subject',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
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
            values: ['sent', 'failed', 'pending']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'error',
            max: 0,
            min: 0,
            name: 'error',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2355380017',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 0,
            name: 'talkId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 0,
            name: 'speakerId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // email_templates
    app.save(
      new Collection({
        id: 'pbc_242159415',
        name: 'email_templates',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'subject',
            max: 0,
            min: 0,
            name: 'subject',
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
            id: 'bodyHtml',
            max: 0,
            min: 0,
            name: 'bodyHtml',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bodyText',
            max: 0,
            min: 0,
            name: 'bodyText',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'variables',
            maxSize: 2000000,
            name: 'variables',
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // order_items
    app.save(
      new Collection({
        id: 'pbc_2456927940',
        name: 'order_items',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'ticketTypeName',
            max: 0,
            min: 0,
            name: 'ticketTypeName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'quantity',
            max: null,
            min: null,
            name: 'quantity',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'unitPrice',
            max: null,
            min: null,
            name: 'unitPrice',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'totalPrice',
            max: null,
            min: null,
            name: 'totalPrice',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3527180448',
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
            cascadeDelete: false,
            collectionId: 'pbc_647540413',
            hidden: false,
            id: 'ticketTypeId',
            maxSelect: 1,
            minSelect: 0,
            name: 'ticketTypeId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // organization_invitations
    app.save(
      new Collection({
        id: 'pbc_1587060730',
        name: 'organization_invitations',
        type: 'base',
        system: false,
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
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            hidden: false,
            id: 'role',
            maxSelect: 1,
            name: 'role',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['admin', 'organizer', 'reviewer']
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
            values: ['pending', 'accepted', 'expired', 'cancelled']
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'invitedBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'invitedBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // organization_members
    app.save(
      new Collection({
        id: 'pbc_2237629860',
        name: 'organization_members',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'role',
            maxSelect: 1,
            name: 'role',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['owner', 'admin', 'organizer', 'reviewer']
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // reimbursement_requests
    app.save(
      new Collection({
        id: 'pbc_516151630',
        name: 'reimbursement_requests',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'requestNumber',
            max: 0,
            min: 0,
            name: 'requestNumber',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']
          },
          {
            hidden: false,
            id: 'totalAmount',
            max: null,
            min: null,
            name: 'totalAmount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'adminNotes',
            max: 0,
            min: 0,
            name: 'adminNotes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'reviewedAt',
            max: '',
            min: '',
            name: 'reviewedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'submittedAt',
            max: '',
            min: '',
            name: 'submittedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 0,
            name: 'speakerId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'reviewedBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'reviewedBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1371503333',
            hidden: false,
            id: 'transactionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'transactionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // reimbursement_items
    app.save(
      new Collection({
        id: 'pbc_2926239131',
        name: 'reimbursement_items',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'expenseType',
            maxSelect: 1,
            name: 'expenseType',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['transport', 'accommodation', 'meals', 'other']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'amount',
            max: null,
            min: null,
            name: 'amount',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'date',
            max: '',
            min: '',
            name: 'date',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'receipt_file',
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
            name: 'receipt',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['100x100'],
            type: 'file'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_516151630',
            hidden: false,
            id: 'requestId',
            maxSelect: 1,
            minSelect: 0,
            name: 'requestId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // reviews
    app.save(
      new Collection({
        id: 'pbc_4163081445',
        name: 'reviews',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'rating',
            max: null,
            min: null,
            name: 'rating',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'comment',
            max: 0,
            min: 0,
            name: 'comment',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2355380017',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 0,
            name: 'talkId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // rooms
    app.save(
      new Collection({
        id: 'pbc_3085411453',
        name: 'rooms',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'capacity',
            max: null,
            min: null,
            name: 'capacity',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'floor',
            max: 0,
            min: 0,
            name: 'floor',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'equipment',
            maxSize: 2000000,
            name: 'equipment',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'equipmentNotes',
            max: 0,
            min: 0,
            name: 'equipmentNotes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: null,
            name: 'order',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // room_assignments
    app.save(
      new Collection({
        id: 'pbc_986726503',
        name: 'room_assignments',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'date',
            max: '',
            min: '',
            name: 'date',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'startTime',
            max: 0,
            min: 0,
            name: 'startTime',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'endTime',
            max: 0,
            min: 0,
            name: 'endTime',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 0,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3085411453',
            hidden: false,
            id: 'roomId',
            maxSelect: 1,
            minSelect: 0,
            name: 'roomId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2237629860',
            hidden: false,
            id: 'memberId',
            maxSelect: 1,
            minSelect: 0,
            name: 'memberId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // segments
    app.save(
      new Collection({
        id: 'pbc_1719698224',
        name: 'segments',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'editionId',
            max: 0,
            min: 0,
            name: 'editionId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'criteria',
            maxSize: 2000000,
            name: 'criteria',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'isStatic',
            name: 'isStatic',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'contactCount',
            max: null,
            min: null,
            name: 'contactCount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // slots
    app.save(
      new Collection({
        id: 'pbc_53644091',
        name: 'slots',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'date',
            max: '',
            min: '',
            name: 'date',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'startTime',
            max: 0,
            min: 0,
            name: 'startTime',
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
            id: 'endTime',
            max: 0,
            min: 0,
            name: 'endTime',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3085411453',
            hidden: false,
            id: 'roomId',
            maxSelect: 1,
            minSelect: 0,
            name: 'roomId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // tracks
    app.save(
      new Collection({
        id: 'pbc_327047008',
        name: 'tracks',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'color',
            max: 0,
            min: 0,
            name: 'color',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: null,
            name: 'order',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sessions
    app.save(
      new Collection({
        id: 'pbc_3660498186',
        name: 'sessions',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'title',
            max: 0,
            min: 0,
            name: 'title',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: [
              'talk',
              'workshop',
              'keynote',
              'panel',
              'break',
              'lunch',
              'networking',
              'registration',
              'other'
            ]
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_53644091',
            hidden: false,
            id: 'slotId',
            maxSelect: 1,
            minSelect: 0,
            name: 'slotId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2355380017',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 0,
            name: 'talkId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_327047008',
            hidden: false,
            id: 'trackId',
            maxSelect: 1,
            minSelect: 0,
            name: 'trackId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'format',
            maxSelect: 1,
            name: 'format',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['in_person', 'online', 'hybrid']
          },
          {
            hidden: false,
            id: 'streamingPlatform',
            maxSelect: 1,
            name: 'streamingPlatform',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['youtube', 'twitch', 'zoom', 'teams', 'meet', 'webex', 'vimeo', 'custom']
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'streamingUrl',
            name: 'streamingUrl',
            onlyDomains: null,
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            hidden: false,
            id: 'streamingAccessLevel',
            maxSelect: 1,
            name: 'streamingAccessLevel',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['public', 'registered', 'password', 'unique']
          },
          {
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
          },
          {
            hidden: false,
            id: 'streamingAllowEmbed',
            name: 'streamingAllowEmbed',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'streamingScheduledStart',
            max: '',
            min: '',
            name: 'streamingScheduledStart',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
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
          },
          {
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
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // speaker_tokens
    app.save(
      new Collection({
        id: 'pbc_3833737304',
        name: 'speaker_tokens',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'token',
            max: 0,
            min: 0,
            name: 'token',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 0,
            name: 'speakerId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // financial_audit_log
    app.save(
      new Collection({
        id: 'pbc_2979272493',
        name: 'financial_audit_log',
        type: 'base',
        system: false,
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
            hidden: false,
            id: 'action',
            maxSelect: 1,
            name: 'action',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: [
              'create',
              'update',
              'delete',
              'status_change',
              'send',
              'accept',
              'reject',
              'convert',
              'submit',
              'approve',
              'mark_paid'
            ]
          },
          {
            hidden: false,
            id: 'entityType',
            maxSelect: 1,
            name: 'entityType',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['transaction', 'quote', 'invoice', 'reimbursement', 'category', 'budget']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'entityId',
            max: 0,
            min: 0,
            name: 'entityId',
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
            id: 'entityReference',
            max: 0,
            min: 0,
            name: 'entityReference',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'oldValue',
            maxSize: 2000000,
            name: 'oldValue',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'newValue',
            maxSize: 2000000,
            name: 'newValue',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'metadata',
            maxSize: 2000000,
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
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: null,
        deleteRule: null
      })
    )

    // sponsors
    app.save(
      new Collection({
        id: 'pbc_sponsors',
        name: 'sponsors',
        type: 'base',
        system: false,
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
            cascadeDelete: false,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'logo',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            name: 'logo',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['100x100', '200x200', '400x400'],
            type: 'file'
          },
          {
            exceptDomains: [],
            hidden: false,
            id: 'website',
            name: 'website',
            onlyDomains: [],
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 2000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'contactName',
            max: 200,
            min: 0,
            name: 'contactName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: [],
            hidden: false,
            id: 'contactEmail',
            name: 'contactEmail',
            onlyDomains: [],
            presentable: false,
            required: false,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'contactPhone',
            max: 50,
            min: 0,
            name: 'contactPhone',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 5000,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: ['CREATE INDEX idx_sponsors_organization ON sponsors (organizationId)'],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_packages
    app.save(
      new Collection({
        id: 'pbc_sponsor_packages',
        name: 'sponsor_packages',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'tier',
            max: null,
            min: 1,
            name: 'tier',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'price',
            max: null,
            min: 0,
            name: 'price',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currency',
            maxSelect: 1,
            name: 'currency',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['EUR', 'USD', 'GBP']
          },
          {
            hidden: false,
            id: 'maxSponsors',
            max: null,
            min: 0,
            name: 'maxSponsors',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'benefits',
            maxSize: 50000,
            name: 'benefits',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 2000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [
          'CREATE INDEX idx_sponsor_packages_edition ON sponsor_packages (editionId)',
          'CREATE INDEX idx_sponsor_packages_tier ON sponsor_packages (editionId, tier)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // edition_sponsors
    app.save(
      new Collection({
        id: 'pbc_edition_sponsors',
        name: 'edition_sponsors',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_sponsors',
            hidden: false,
            id: 'sponsorId',
            maxSelect: 1,
            minSelect: 0,
            name: 'sponsorId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_sponsor_packages',
            hidden: false,
            id: 'packageId',
            maxSelect: 1,
            minSelect: 0,
            name: 'packageId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
            values: ['prospect', 'contacted', 'negotiating', 'confirmed', 'declined', 'cancelled']
          },
          {
            hidden: false,
            id: 'confirmedAt',
            max: '',
            min: '',
            name: 'confirmedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'paidAt',
            max: '',
            min: '',
            name: 'paidAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'amount',
            max: null,
            min: 0,
            name: 'amount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 5000,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE INDEX idx_edition_sponsors_edition ON edition_sponsors (editionId)',
          'CREATE INDEX idx_edition_sponsors_sponsor ON edition_sponsors (sponsorId)',
          'CREATE UNIQUE INDEX idx_edition_sponsors_unique ON edition_sponsors (editionId, sponsorId)',
          'CREATE INDEX idx_edition_sponsors_status ON edition_sponsors (editionId, status)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_tokens
    app.save(
      new Collection({
        id: 'pbc_sponsor_tokens',
        name: 'sponsor_tokens',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_edition_sponsors',
            hidden: false,
            id: 'editionSponsorId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionSponsorId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'token',
            max: 0,
            min: 0,
            name: 'token',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'lastUsedAt',
            max: '',
            min: '',
            name: 'lastUsedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          }
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_sponsor_tokens_token ON sponsor_tokens (token)',
          'CREATE INDEX idx_sponsor_tokens_edition_sponsor ON sponsor_tokens (editionSponsorId)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_deliverables
    app.save(
      new Collection({
        id: 'pbc_sponsor_deliverables',
        name: 'sponsor_deliverables',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_edition_sponsors',
            hidden: false,
            id: 'editionSponsorId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionSponsorId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'benefitName',
            max: 200,
            min: 1,
            name: 'benefitName',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 2000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
            values: ['pending', 'in_progress', 'delivered']
          },
          {
            hidden: false,
            id: 'dueDate',
            max: '',
            min: '',
            name: 'dueDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'deliveredAt',
            max: '',
            min: '',
            name: 'deliveredAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 5000,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE INDEX idx_sponsor_deliverables_edition_sponsor ON sponsor_deliverables (editionSponsorId)',
          'CREATE INDEX idx_sponsor_deliverables_status ON sponsor_deliverables (editionSponsorId, status)',
          'CREATE INDEX idx_sponsor_deliverables_due_date ON sponsor_deliverables (dueDate)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_messages
    app.save(
      new Collection({
        id: 'pbc_sponsor_messages',
        name: 'sponsor_messages',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_edition_sponsors',
            hidden: false,
            id: 'editionSponsorId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionSponsorId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'senderType',
            maxSelect: 1,
            name: 'senderType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['organizer', 'sponsor']
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'senderUserId',
            maxSelect: 1,
            minSelect: 0,
            name: 'senderUserId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'senderName',
            max: 200,
            min: 0,
            name: 'senderName',
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
            id: 'subject',
            max: 500,
            min: 0,
            name: 'subject',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'content',
            max: 10000,
            min: 1,
            name: 'content',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'attachments',
            maxSelect: 10,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
            name: 'attachments',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['100x100'],
            type: 'file'
          },
          {
            hidden: false,
            id: 'readAt',
            max: '',
            min: '',
            name: 'readAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX idx_sponsor_messages_edition_sponsor ON sponsor_messages (editionSponsorId)',
          'CREATE INDEX idx_sponsor_messages_sender_type ON sponsor_messages (editionSponsorId, senderType)',
          'CREATE INDEX idx_sponsor_messages_unread ON sponsor_messages (editionSponsorId, readAt)',
          'CREATE INDEX idx_sponsor_messages_created ON sponsor_messages (editionSponsorId, created DESC)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // team_members
    app.save(
      new Collection({
        id: 'pbc_team_members',
        name: 'team_members',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'slug',
            max: 100,
            min: 2,
            name: 'slug',
            pattern: '^[a-z0-9-]+$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'team',
            max: 100,
            min: 0,
            name: 'team',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'role',
            max: 200,
            min: 0,
            name: 'role',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bio',
            max: 2000,
            min: 0,
            name: 'bio',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'photo',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            name: 'photo',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['100x100', '200x200'],
            type: 'file'
          },
          {
            exceptDomains: [],
            hidden: false,
            id: 'photoUrl',
            name: 'photoUrl',
            onlyDomains: [],
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            hidden: false,
            id: 'socials',
            maxSize: 2000000,
            name: 'socials',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'displayOrder',
            max: null,
            min: 0,
            name: 'displayOrder',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_team_members_edition_slug ON team_members (editionId, slug)',
          'CREATE INDEX idx_team_members_edition ON team_members (editionId)',
          'CREATE INDEX idx_team_members_team ON team_members (team)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // alert_thresholds
    app.save(
      new Collection({
        id: 'pbc_alert_thresholds',
        name: 'alert_thresholds',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 0,
            min: 0,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'editionId',
            max: 0,
            min: 0,
            name: 'editionId',
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
            id: 'metricSource',
            max: 0,
            min: 0,
            name: 'metricSource',
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
            id: 'operator',
            max: 0,
            min: 0,
            name: 'operator',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'thresholdValue',
            max: null,
            min: null,
            name: 'thresholdValue',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'level',
            max: 0,
            min: 0,
            name: 'level',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'enabled',
            name: 'enabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'notifyByEmail',
            name: 'notifyByEmail',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'notifyInApp',
            name: 'notifyInApp',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'emailRecipients',
            maxSize: 2000000,
            name: 'emailRecipients',
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // alerts
    app.save(
      new Collection({
        id: 'pbc_alerts',
        name: 'alerts',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'editionId',
            max: 0,
            min: 0,
            name: 'editionId',
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
            id: 'thresholdId',
            max: 0,
            min: 0,
            name: 'thresholdId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'title',
            max: 0,
            min: 0,
            name: 'title',
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
            id: 'message',
            max: 0,
            min: 0,
            name: 'message',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'level',
            max: 0,
            min: 0,
            name: 'level',
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
            id: 'metricSource',
            max: 0,
            min: 0,
            name: 'metricSource',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'currentValue',
            max: null,
            min: null,
            name: 'currentValue',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'thresholdValue',
            max: null,
            min: null,
            name: 'thresholdValue',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'status',
            max: 0,
            min: 0,
            name: 'status',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'acknowledgedBy',
            max: 0,
            min: 0,
            name: 'acknowledgedBy',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'acknowledgedAt',
            max: '',
            min: '',
            name: 'acknowledgedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'resolvedAt',
            max: '',
            min: '',
            name: 'resolvedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'dismissedBy',
            max: 0,
            min: 0,
            name: 'dismissedBy',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'dismissedAt',
            max: '',
            min: '',
            name: 'dismissedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // report_configs
    app.save(
      new Collection({
        id: 'pbc_report_configs',
        name: 'report_configs',
        type: 'base',
        system: false,
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
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'enabled',
            name: 'enabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'frequency',
            max: 20,
            min: 1,
            name: 'frequency',
            pattern: '^(daily|weekly|monthly)$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'dayOfWeek',
            max: 20,
            min: 0,
            name: 'dayOfWeek',
            pattern: '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)?$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'dayOfMonth',
            max: 31,
            min: 1,
            name: 'dayOfMonth',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'timeOfDay',
            max: 5,
            min: 5,
            name: 'timeOfDay',
            pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'timezone',
            max: 50,
            min: 1,
            name: 'timezone',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'recipients',
            maxSize: 10000,
            name: 'recipients',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'sections',
            maxSize: 1000,
            name: 'sections',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'lastSentAt',
            max: '',
            min: '',
            name: 'lastSentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'nextScheduledAt',
            max: '',
            min: '',
            name: 'nextScheduledAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
          },
          {
            hidden: false,
            id: 'recipientRoles',
            maxSize: 500,
            name: 'recipientRoles',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          }
        ],
        indexes: [
          'CREATE INDEX idx_report_configs_edition ON report_configs (editionId)',
          'CREATE INDEX idx_report_configs_enabled ON report_configs (enabled)',
          'CREATE INDEX idx_report_configs_next_scheduled ON report_configs (nextScheduledAt)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_inquiries
    app.save(
      new Collection({
        id: 'pbc_sponsor_inquiries',
        name: 'sponsor_inquiries',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'companyName',
            max: 200,
            min: 1,
            name: 'companyName',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'contactName',
            max: 200,
            min: 1,
            name: 'contactName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'contactEmail',
            name: 'contactEmail',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'contactPhone',
            max: 50,
            min: 0,
            name: 'contactPhone',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'message',
            max: 5000,
            min: 1,
            name: 'message',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_sponsor_packages',
            hidden: false,
            id: 'interestedPackageId',
            maxSelect: 1,
            minSelect: 0,
            name: 'interestedPackageId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
            values: ['pending', 'contacted', 'converted', 'rejected']
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
        indexes: [
          'CREATE INDEX idx_sponsor_inquiries_edition ON sponsor_inquiries (editionId)',
          'CREATE INDEX idx_sponsor_inquiries_status ON sponsor_inquiries (status)',
          'CREATE INDEX idx_sponsor_inquiries_created ON sponsor_inquiries (created)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // api_keys
    app.save(
      new Collection({
        id: 'pbc_api_keys',
        name: 'api_keys',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'keyHash',
            max: 0,
            min: 0,
            name: 'keyHash',
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
            id: 'keyPrefix',
            max: 12,
            min: 12,
            name: 'keyPrefix',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'permissions',
            maxSize: 2000000,
            name: 'permissions',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'rateLimit',
            max: null,
            min: 1,
            name: 'rateLimit',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'lastUsedAt',
            max: '',
            min: '',
            name: 'lastUsedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_api_keys_key_prefix ON api_keys (keyPrefix)',
          'CREATE INDEX idx_api_keys_organization ON api_keys (organizationId)',
          'CREATE INDEX idx_api_keys_event ON api_keys (eventId)',
          'CREATE INDEX idx_api_keys_edition ON api_keys (editionId)',
          'CREATE INDEX idx_api_keys_created_by ON api_keys (createdBy)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // api_request_logs
    app.save(
      new Collection({
        id: 'pbc_api_request_logs',
        name: 'api_request_logs',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_api_keys',
            hidden: false,
            id: 'apiKeyId',
            maxSelect: 1,
            minSelect: 0,
            name: 'apiKeyId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'method',
            max: 10,
            min: 1,
            name: 'method',
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
            id: 'path',
            max: 2000,
            min: 1,
            name: 'path',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'statusCode',
            max: null,
            min: 100,
            name: 'statusCode',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'responseTimeMs',
            max: null,
            min: 0,
            name: 'responseTimeMs',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ipAddress',
            max: 45,
            min: 0,
            name: 'ipAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'userAgent',
            max: 500,
            min: 0,
            name: 'userAgent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_api_request_logs_api_key ON api_request_logs (apiKeyId)',
          'CREATE INDEX idx_api_request_logs_created ON api_request_logs (created)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // webhooks
    app.save(
      new Collection({
        id: 'pbc_webhooks',
        name: 'webhooks',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: [],
            hidden: false,
            id: 'url',
            name: 'url',
            onlyDomains: [],
            presentable: false,
            required: true,
            system: false,
            type: 'url'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'secret',
            max: 0,
            min: 0,
            name: 'secret',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'events',
            maxSize: 2000000,
            name: 'events',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'headers',
            maxSize: 2000000,
            name: 'headers',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'retryCount',
            max: 10,
            min: 0,
            name: 'retryCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_webhooks_organization ON webhooks (organizationId)',
          'CREATE INDEX idx_webhooks_event ON webhooks (eventId)',
          'CREATE INDEX idx_webhooks_edition ON webhooks (editionId)',
          'CREATE INDEX idx_webhooks_created_by ON webhooks (createdBy)',
          'CREATE INDEX idx_webhooks_is_active ON webhooks (isActive)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // webhook_deliveries
    app.save(
      new Collection({
        id: 'pbc_webhook_deliveries',
        name: 'webhook_deliveries',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_webhooks',
            hidden: false,
            id: 'webhookId',
            maxSelect: 1,
            minSelect: 0,
            name: 'webhookId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'event',
            max: 100,
            min: 1,
            name: 'event',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'payload',
            maxSize: 2000000,
            name: 'payload',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'statusCode',
            max: null,
            min: null,
            name: 'statusCode',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'responseBody',
            max: 0,
            min: 0,
            name: 'responseBody',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'attempt',
            max: null,
            min: 1,
            name: 'attempt',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'nextRetryAt',
            max: '',
            min: '',
            name: 'nextRetryAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'deliveredAt',
            max: '',
            min: '',
            name: 'deliveredAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'error',
            max: 0,
            min: 0,
            name: 'error',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries (webhookId)',
          'CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries (event)',
          'CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries (created)',
          'CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries (nextRetryAt)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // email_events
    app.save(
      new Collection({
        id: 'pbc_email_events',
        name: 'email_events',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'campaignId',
            max: 0,
            min: 0,
            name: 'campaignId',
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
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['opened', 'clicked', 'bounced', 'unsubscribed', 'complained']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'url',
            max: 0,
            min: 0,
            name: 'url',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'linkId',
            max: 0,
            min: 0,
            name: 'linkId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'bounceType',
            maxSelect: 1,
            name: 'bounceType',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['hard', 'soft', 'unknown']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'bounceReason',
            max: 0,
            min: 0,
            name: 'bounceReason',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ipAddress',
            max: 0,
            min: 0,
            name: 'ipAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'userAgent',
            max: 0,
            min: 0,
            name: 'userAgent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'timestamp',
            max: '',
            min: '',
            name: 'timestamp',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_email_events_campaign ON email_events (campaignId)',
          'CREATE INDEX idx_email_events_contact ON email_events (contactId)',
          'CREATE INDEX idx_email_events_type ON email_events (type)',
          'CREATE INDEX idx_email_events_campaign_type ON email_events (campaignId, type)',
          'CREATE INDEX idx_email_events_campaign_contact ON email_events (campaignId, contactId)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // sponsor_assets
    app.save(
      new Collection({
        id: 'pbc_sponsor_assets',
        name: 'sponsor_assets',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_edition_sponsors',
            hidden: false,
            id: 'editionSponsorId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionSponsorId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'category',
            maxSelect: 1,
            name: 'category',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['logo_color', 'logo_mono', 'logo_light', 'logo_dark', 'visual', 'document']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 1000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'file',
            maxSelect: 1,
            maxSize: 52428800,
            mimeTypes: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/svg+xml',
              'application/pdf',
              'application/illustrator',
              'application/postscript',
              'image/vnd.adobe.photoshop'
            ],
            name: 'file',
            presentable: false,
            protected: false,
            required: true,
            system: false,
            thumbs: ['100x100', '200x200', '400x400'],
            type: 'file'
          },
          {
            hidden: false,
            id: 'fileSize',
            max: null,
            min: 0,
            name: 'fileSize',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'mimeType',
            max: 100,
            min: 0,
            name: 'mimeType',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'width',
            max: null,
            min: 0,
            name: 'width',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'height',
            max: null,
            min: 0,
            name: 'height',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'usage',
            max: 500,
            min: 0,
            name: 'usage',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE INDEX idx_sponsor_assets_edition_sponsor ON sponsor_assets (editionSponsorId)',
          'CREATE INDEX idx_sponsor_assets_category ON sponsor_assets (editionSponsorId, category)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // segment_memberships
    app.save(
      new Collection({
        id: 'pbc_segment_memberships',
        name: 'segment_memberships',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'segmentId',
            max: 0,
            min: 0,
            name: 'segmentId',
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
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'joinedAt',
            max: '',
            min: '',
            name: 'joinedAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'leftAt',
            max: '',
            min: '',
            name: 'leftAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_segment_memberships_segment ON segment_memberships (segmentId)',
          'CREATE INDEX idx_segment_memberships_contact ON segment_memberships (contactId)',
          'CREATE INDEX idx_segment_memberships_active ON segment_memberships (segmentId, isActive)',
          'CREATE UNIQUE INDEX idx_segment_memberships_unique ON segment_memberships (segmentId, contactId, isActive) WHERE isActive = true'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // suppression_list
    app.save(
      new Collection({
        id: 'pbc_suppression_list',
        name: 'suppression_list',
        type: 'base',
        system: false,
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
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: true,
            required: true,
            system: false,
            type: 'email'
          },
          {
            hidden: false,
            id: 'reason',
            maxSelect: 1,
            name: 'reason',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['hard_bounce', 'soft_bounce_limit', 'complaint', 'unsubscribe', 'manual']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'source',
            max: 0,
            min: 0,
            name: 'source',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'note',
            max: 0,
            min: 0,
            name: 'note',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_suppression_list_email ON suppression_list (email)',
          'CREATE INDEX idx_suppression_list_organization ON suppression_list (organizationId)',
          'CREATE INDEX idx_suppression_list_event ON suppression_list (eventId)',
          'CREATE INDEX idx_suppression_list_reason ON suppression_list (reason)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // contact_activities
    app.save(
      new Collection({
        id: 'pbc_contact_activities',
        name: 'contact_activities',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'email_sent',
              'email_opened',
              'email_clicked',
              'email_bounced',
              'email_unsubscribed',
              'ticket_purchased',
              'ticket_checked_in',
              'ticket_refunded',
              'talk_submitted',
              'talk_accepted',
              'talk_rejected',
              'consent_granted',
              'consent_revoked',
              'tag_added',
              'tag_removed',
              'contact_created',
              'contact_updated',
              'contact_imported',
              'contact_synced',
              'segment_joined',
              'segment_left'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'metadata',
            maxSize: 0,
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_contact_activities_contact ON contact_activities (contactId)',
          'CREATE INDEX idx_contact_activities_type ON contact_activities (type)',
          'CREATE INDEX idx_contact_activities_event ON contact_activities (eventId)',
          'CREATE INDEX idx_contact_activities_edition ON contact_activities (editionId)',
          'CREATE INDEX idx_contact_activities_contact_type ON contact_activities (contactId, type)',
          'CREATE INDEX idx_contact_activities_created ON contact_activities (created DESC)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // consent_audit_logs
    app.save(
      new Collection({
        id: 'pbc_consent_audit',
        name: 'consent_audit_logs',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
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
            id: 'consentId',
            max: 0,
            min: 0,
            name: 'consentId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'action',
            maxSelect: 1,
            name: 'action',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'granted',
              'withdrawn',
              'confirmed',
              'unsubscribed',
              'preferences_updated',
              'data_exported',
              'data_deleted'
            ]
          },
          {
            hidden: false,
            id: 'consentType',
            maxSelect: 1,
            name: 'consentType',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: [
              'marketing_email',
              'newsletter',
              'event_updates',
              'partner_communications',
              'data_sharing',
              'analytics'
            ]
          },
          {
            hidden: false,
            id: 'source',
            maxSelect: 1,
            name: 'source',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'form',
              'import',
              'api',
              'manual',
              'preference_center',
              'unsubscribe_link',
              'double_opt_in',
              'gdpr_request'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ipAddress',
            max: 0,
            min: 0,
            name: 'ipAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'userAgent',
            max: 0,
            min: 0,
            name: 'userAgent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'metadata',
            maxSize: 2000000,
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_consent_audit_contact ON consent_audit_logs (contactId)',
          'CREATE INDEX idx_consent_audit_action ON consent_audit_logs (action)',
          'CREATE INDEX idx_consent_audit_created ON consent_audit_logs (created)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: null,
        deleteRule: null
      })
    )

    // communication_preferences
    app.save(
      new Collection({
        id: 'pbc_comm_prefs',
        name: 'communication_preferences',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
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
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'newsletter',
            name: 'newsletter',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'eventUpdates',
            name: 'eventUpdates',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'partnerCommunications',
            name: 'partnerCommunications',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'frequency',
            maxSelect: 1,
            name: 'frequency',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['immediate', 'daily', 'weekly', 'monthly']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'preferenceToken',
            max: 0,
            min: 0,
            name: 'preferenceToken',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_comm_prefs_contact_event ON communication_preferences (contactId, eventId)',
          'CREATE INDEX idx_comm_prefs_token ON communication_preferences (preferenceToken)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // data_retention_policies
    app.save(
      new Collection({
        id: 'pbc_retention',
        name: 'data_retention_policies',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'dataType',
            max: 0,
            min: 0,
            name: 'dataType',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'retentionDays',
            max: 3650,
            min: 1,
            name: 'retentionDays',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'warningDays',
            max: 365,
            min: 1,
            name: 'warningDays',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autoDelete',
            name: 'autoDelete',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_retention_event_type ON data_retention_policies (eventId, dataType)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // custom_fields
    app.save(
      new Collection({
        id: 'pbc_custom_fields',
        name: 'custom_fields',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
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
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'key',
            max: 50,
            min: 1,
            name: 'key',
            pattern: '^[a-z][a-z0-9_]*$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'fieldType',
            maxSelect: 1,
            name: 'fieldType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['text', 'number', 'date', 'select', 'checkbox', 'url', 'textarea']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isRequired',
            name: 'isRequired',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'options',
            maxSize: 2000000,
            name: 'options',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'displayOrder',
            max: 1000,
            min: 0,
            name: 'displayOrder',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_custom_fields_event_key ON custom_fields (eventId, key)',
          'CREATE INDEX idx_custom_fields_event ON custom_fields (eventId)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // contact_custom_values
    app.save(
      new Collection({
        id: 'pbc_contact_values',
        name: 'contact_custom_values',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
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
            id: 'fieldId',
            max: 0,
            min: 0,
            name: 'fieldId',
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
            id: 'value',
            max: 0,
            min: 0,
            name: 'value',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_contact_values_unique ON contact_custom_values (contactId, fieldId)',
          'CREATE INDEX idx_contact_values_contact ON contact_custom_values (contactId)',
          'CREATE INDEX idx_contact_values_field ON contact_custom_values (fieldId)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // lead_scoring_rules
    app.save(
      new Collection({
        id: 'pbc_scoring_rules',
        name: 'lead_scoring_rules',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'eventId',
            max: 0,
            min: 0,
            name: 'eventId',
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
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'action',
            maxSelect: 1,
            name: 'action',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'email_opened',
              'email_clicked',
              'ticket_purchased',
              'ticket_checked_in',
              'talk_submitted',
              'talk_accepted',
              'segment_joined',
              'inactivity',
              'custom'
            ]
          },
          {
            hidden: false,
            id: 'points',
            max: 1000,
            min: -1000,
            name: 'points',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'inactivityDays',
            max: 365,
            min: 1,
            name: 'inactivityDays',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: ['CREATE INDEX idx_scoring_rules_event ON lead_scoring_rules (eventId)'],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // lead_score_history
    app.save(
      new Collection({
        id: 'pbc_score_history',
        name: 'lead_score_history',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'contactId',
            max: 0,
            min: 0,
            name: 'contactId',
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
            id: 'ruleId',
            max: 0,
            min: 0,
            name: 'ruleId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'action',
            maxSelect: 1,
            name: 'action',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'email_opened',
              'email_clicked',
              'ticket_purchased',
              'ticket_checked_in',
              'talk_submitted',
              'talk_accepted',
              'segment_joined',
              'inactivity',
              'custom',
              'manual_adjustment'
            ]
          },
          {
            hidden: false,
            id: 'pointsChange',
            max: 1000,
            min: -1000,
            name: 'pointsChange',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'previousScore',
            max: 100000,
            min: -100000,
            name: 'previousScore',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'newScore',
            max: 100000,
            min: -100000,
            name: 'newScore',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'metadata',
            maxSize: 2000000,
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_score_history_contact ON lead_score_history (contactId)',
          'CREATE INDEX idx_score_history_created ON lead_score_history (created)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: null,
        deleteRule: null
      })
    )

    // duplicate_pairs
    app.save(
      new Collection({
        id: 'pbc_duplicate_pairs',
        name: 'duplicate_pairs',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 1,
            name: 'eventId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId1',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId1',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId2',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId2',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'matchType',
            maxSelect: 1,
            name: 'matchType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['exact_email', 'similar_name', 'similar_combined']
          },
          {
            hidden: false,
            id: 'confidenceScore',
            max: 100,
            min: 0,
            name: 'confidenceScore',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['pending', 'merged', 'dismissed']
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'mergedContactId',
            maxSelect: 1,
            minSelect: 0,
            name: 'mergedContactId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'dismissedBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'dismissedBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'dismissedAt',
            max: '',
            min: '',
            name: 'dismissedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX idx_duplicate_pairs_event ON duplicate_pairs (eventId)',
          'CREATE INDEX idx_duplicate_pairs_contact1 ON duplicate_pairs (contactId1)',
          'CREATE INDEX idx_duplicate_pairs_contact2 ON duplicate_pairs (contactId2)',
          'CREATE INDEX idx_duplicate_pairs_status ON duplicate_pairs (status)',
          'CREATE UNIQUE INDEX idx_duplicate_pairs_unique ON duplicate_pairs (contactId1, contactId2)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // contact_event_participations
    app.save(
      new Collection({
        id: 'pbc_contact_event_participations',
        name: 'contact_event_participations',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 1,
            name: 'eventId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
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
            hidden: false,
            id: 'participationType',
            maxSelect: 1,
            name: 'participationType',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: [
              'registered',
              'ticket_purchased',
              'checked_in',
              'talk_submitted',
              'talk_accepted',
              'talk_rejected',
              'speaker',
              'volunteer',
              'sponsor_contact'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'relatedEntityId',
            max: 50,
            min: 0,
            name: 'relatedEntityId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'relatedEntityType',
            max: 50,
            min: 0,
            name: 'relatedEntityType',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
            id: 'occurredAt',
            max: '',
            min: '',
            name: 'occurredAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX idx_cep_contact ON contact_event_participations (contactId)',
          'CREATE INDEX idx_cep_event ON contact_event_participations (eventId)',
          'CREATE INDEX idx_cep_edition ON contact_event_participations (editionId)',
          'CREATE INDEX idx_cep_type ON contact_event_participations (participationType)',
          'CREATE INDEX idx_cep_occurred ON contact_event_participations (occurredAt)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // contact_merge_history
    app.save(
      new Collection({
        id: 'pbc_contact_merge_history',
        name: 'contact_merge_history',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 1,
            name: 'eventId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'survivorContactId',
            maxSelect: 1,
            minSelect: 1,
            name: 'survivorContactId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'mergedContactId',
            max: 50,
            min: 1,
            name: 'mergedContactId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'survivorData',
            maxSize: 50000,
            name: 'survivorData',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'mergedData',
            maxSize: 50000,
            name: 'mergedData',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'mergeDecisions',
            maxSize: 10000,
            name: 'mergeDecisions',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'mergedBy',
            maxSelect: 1,
            minSelect: 1,
            name: 'mergedBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'undone',
            name: 'undone',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'undoneAt',
            max: '',
            min: '',
            name: 'undoneAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'undoneBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'undoneBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_cmh_event ON contact_merge_history (eventId)',
          'CREATE INDEX idx_cmh_survivor ON contact_merge_history (survivorContactId)',
          'CREATE INDEX idx_cmh_merged ON contact_merge_history (mergedContactId)',
          'CREATE INDEX idx_cmh_created ON contact_merge_history (created)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // library_templates
    app.save(
      new Collection({
        id: 'pbc_library_templates',
        name: 'library_templates',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 0,
            name: 'eventId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'category',
            maxSelect: 1,
            name: 'category',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: [
              'invitation',
              'confirmation',
              'reminder',
              'thank_you',
              'newsletter',
              'cfp',
              'speaker',
              'sponsor',
              'custom'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 200,
            min: 1,
            name: 'subject',
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
            id: 'htmlContent',
            max: 500000,
            min: 0,
            name: 'htmlContent',
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
            id: 'textContent',
            max: 100000,
            min: 0,
            name: 'textContent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'tags',
            maxSize: 5000,
            name: 'tags',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'thumbnail',
            maxSelect: 1,
            maxSize: 1048576,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            name: 'thumbnail',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['200x150'],
            type: 'file'
          },
          {
            hidden: false,
            id: 'isGlobal',
            name: 'isGlobal',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'isFavorite',
            name: 'isFavorite',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'isPinned',
            name: 'isPinned',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'usageCount',
            max: null,
            min: 0,
            name: 'usageCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_library_templates_event ON library_templates (eventId)',
          'CREATE INDEX idx_library_templates_category ON library_templates (category)',
          'CREATE INDEX idx_library_templates_global ON library_templates (isGlobal)',
          'CREATE INDEX idx_library_templates_favorite ON library_templates (isFavorite)',
          'CREATE INDEX idx_library_templates_pinned ON library_templates (isPinned)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // ab_test_campaigns
    app.save(
      new Collection({
        id: 'pbc_ab_test_campaigns',
        name: 'ab_test_campaigns',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 1,
            name: 'eventId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1719698224',
            hidden: false,
            id: 'segmentId',
            maxSelect: 1,
            minSelect: 0,
            name: 'segmentId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'testVariable',
            maxSelect: 1,
            name: 'testVariable',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['subject', 'content', 'sender_name', 'send_time']
          },
          {
            hidden: false,
            id: 'winnerCriteria',
            maxSelect: 1,
            name: 'winnerCriteria',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['open_rate', 'click_rate']
          },
          {
            hidden: false,
            id: 'testPercentage',
            max: 50,
            min: 10,
            name: 'testPercentage',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'testDurationHours',
            max: 168,
            min: 1,
            name: 'testDurationHours',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['draft', 'testing', 'winner_selected', 'completed', 'cancelled']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'winnerVariantId',
            max: 50,
            min: 0,
            name: 'winnerVariantId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'winnerSelectedAt',
            max: '',
            min: '',
            name: 'winnerSelectedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'testStartedAt',
            max: '',
            min: '',
            name: 'testStartedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'testEndedAt',
            max: '',
            min: '',
            name: 'testEndedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'totalRecipients',
            max: null,
            min: 0,
            name: 'totalRecipients',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_ab_tests_event ON ab_test_campaigns (eventId)',
          'CREATE INDEX idx_ab_tests_edition ON ab_test_campaigns (editionId)',
          'CREATE INDEX idx_ab_tests_status ON ab_test_campaigns (status)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // ab_test_variants
    app.save(
      new Collection({
        id: 'pbc_ab_test_variants',
        name: 'ab_test_variants',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_ab_test_campaigns',
            hidden: false,
            id: 'testId',
            maxSelect: 1,
            minSelect: 1,
            name: 'testId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'name',
            maxSelect: 1,
            name: 'name',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['A', 'B', 'C']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 200,
            min: 1,
            name: 'subject',
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
            id: 'htmlContent',
            max: 500000,
            min: 0,
            name: 'htmlContent',
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
            id: 'textContent',
            max: 100000,
            min: 0,
            name: 'textContent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'senderName',
            max: 100,
            min: 0,
            name: 'senderName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'scheduledAt',
            max: '',
            min: '',
            name: 'scheduledAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'recipientCount',
            max: null,
            min: 0,
            name: 'recipientCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'sentCount',
            max: null,
            min: 0,
            name: 'sentCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'deliveredCount',
            max: null,
            min: 0,
            name: 'deliveredCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'openedCount',
            max: null,
            min: 0,
            name: 'openedCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'clickedCount',
            max: null,
            min: 0,
            name: 'clickedCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'bouncedCount',
            max: null,
            min: 0,
            name: 'bouncedCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'isWinner',
            name: 'isWinner',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [
          'CREATE INDEX idx_ab_variants_test ON ab_test_variants (testId)',
          'CREATE UNIQUE INDEX idx_ab_variants_unique ON ab_test_variants (testId, name)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // automations
    app.save(
      new Collection({
        id: 'pbc_automations',
        name: 'automations',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_1687431684',
            hidden: false,
            id: 'eventId',
            maxSelect: 1,
            minSelect: 1,
            name: 'eventId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 2000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'triggerType',
            maxSelect: 1,
            name: 'triggerType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'contact_created',
              'ticket_purchased',
              'checked_in',
              'tag_added',
              'consent_given',
              'scheduled_date',
              'talk_submitted',
              'talk_accepted',
              'talk_rejected'
            ]
          },
          {
            hidden: false,
            id: 'triggerConfig',
            maxSize: 65536,
            name: 'triggerConfig',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['draft', 'active', 'paused']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'startStepId',
            max: 50,
            min: 0,
            name: 'startStepId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'enrollmentCount',
            max: null,
            min: 0,
            name: 'enrollmentCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'completedCount',
            max: null,
            min: 0,
            name: 'completedCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_automations_eventId ON automations (eventId)',
          'CREATE INDEX idx_automations_editionId ON automations (editionId)',
          'CREATE INDEX idx_automations_status ON automations (status)',
          'CREATE INDEX idx_automations_triggerType ON automations (triggerType)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // automation_steps
    app.save(
      new Collection({
        id: 'pbc_automation_steps',
        name: 'automation_steps',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_automations',
            hidden: false,
            id: 'automationId',
            maxSelect: 1,
            minSelect: 1,
            name: 'automationId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: [
              'send_email',
              'wait',
              'condition',
              'add_tag',
              'remove_tag',
              'update_field',
              'webhook'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 0,
            name: 'name',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'config',
            maxSize: 65536,
            name: 'config',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'position',
            max: null,
            min: 0,
            name: 'position',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'nextStepId',
            max: 50,
            min: 0,
            name: 'nextStepId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE INDEX idx_automation_steps_automationId ON automation_steps (automationId)',
          'CREATE INDEX idx_automation_steps_type ON automation_steps (type)',
          'CREATE INDEX idx_automation_steps_position ON automation_steps (position)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // automation_enrollments
    app.save(
      new Collection({
        id: 'pbc_automation_enrollments',
        name: 'automation_enrollments',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_automations',
            hidden: false,
            id: 'automationId',
            maxSelect: 1,
            minSelect: 1,
            name: 'automationId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'currentStepId',
            max: 50,
            min: 0,
            name: 'currentStepId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['active', 'completed', 'exited', 'failed']
          },
          {
            hidden: false,
            id: 'startedAt',
            max: '',
            min: '',
            name: 'startedAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'completedAt',
            max: '',
            min: '',
            name: 'completedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'exitedAt',
            max: '',
            min: '',
            name: 'exitedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'exitReason',
            max: 500,
            min: 0,
            name: 'exitReason',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'waitUntil',
            max: '',
            min: '',
            name: 'waitUntil',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX idx_automation_enrollments_automationId ON automation_enrollments (automationId)',
          'CREATE INDEX idx_automation_enrollments_contactId ON automation_enrollments (contactId)',
          'CREATE INDEX idx_automation_enrollments_status ON automation_enrollments (status)',
          'CREATE UNIQUE INDEX idx_automation_enrollments_unique ON automation_enrollments (automationId, contactId)',
          'CREATE INDEX idx_automation_enrollments_waitUntil ON automation_enrollments (waitUntil)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // automation_logs
    app.save(
      new Collection({
        id: 'pbc_automation_logs',
        name: 'automation_logs',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_automations',
            hidden: false,
            id: 'automationId',
            maxSelect: 1,
            minSelect: 1,
            name: 'automationId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_automation_enrollments',
            hidden: false,
            id: 'enrollmentId',
            maxSelect: 1,
            minSelect: 1,
            name: 'enrollmentId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1930317162',
            hidden: false,
            id: 'contactId',
            maxSelect: 1,
            minSelect: 1,
            name: 'contactId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'stepId',
            max: 50,
            min: 1,
            name: 'stepId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'stepType',
            maxSelect: 1,
            name: 'stepType',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: [
              'send_email',
              'wait',
              'condition',
              'add_tag',
              'remove_tag',
              'update_field',
              'webhook'
            ]
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['pending', 'executing', 'completed', 'failed', 'skipped']
          },
          {
            hidden: false,
            id: 'input',
            maxSize: 65536,
            name: 'input',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'output',
            maxSize: 65536,
            name: 'output',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'error',
            max: 2000,
            min: 0,
            name: 'error',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'executedAt',
            max: '',
            min: '',
            name: 'executedAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX idx_automation_logs_automationId ON automation_logs (automationId)',
          'CREATE INDEX idx_automation_logs_enrollmentId ON automation_logs (enrollmentId)',
          'CREATE INDEX idx_automation_logs_contactId ON automation_logs (contactId)',
          'CREATE INDEX idx_automation_logs_status ON automation_logs (status)',
          'CREATE INDEX idx_automation_logs_executedAt ON automation_logs (executedAt)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: null,
        deleteRule: null
      })
    )

    // promo_codes
    app.save(
      new Collection({
        id: 'pbc_promo_codes',
        name: 'promo_codes',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'code',
            max: 50,
            min: 3,
            name: 'code',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
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
            id: 'description',
            max: 0,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'discountType',
            maxSelect: 1,
            name: 'discountType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['percentage', 'fixed', 'free']
          },
          {
            hidden: false,
            id: 'discountValue',
            max: null,
            min: 0,
            name: 'discountValue',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'minOrderAmount',
            max: null,
            min: 0,
            name: 'minOrderAmount',
            onlyInt: false,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'maxUsageCount',
            max: null,
            min: 0,
            name: 'maxUsageCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'maxUsagePerPerson',
            max: null,
            min: 1,
            name: 'maxUsagePerPerson',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'currentUsageCount',
            max: null,
            min: 0,
            name: 'currentUsageCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'applicableTicketTypeIds',
            maxSize: 2000000,
            name: 'applicableTicketTypeIds',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'startsAt',
            max: '',
            min: '',
            name: 'startsAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE UNIQUE INDEX idx_promo_codes_edition_code ON promo_codes (editionId, code)',
          'CREATE INDEX idx_promo_codes_edition ON promo_codes (editionId)',
          'CREATE INDEX idx_promo_codes_active ON promo_codes (isActive)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // promo_code_usages
    app.save(
      new Collection({
        id: 'pbc_promo_code_usages',
        name: 'promo_code_usages',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_promo_codes',
            hidden: false,
            id: 'promoCodeId',
            maxSelect: 1,
            minSelect: 0,
            name: 'promoCodeId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3527180448',
            hidden: false,
            id: 'orderId',
            maxSelect: 1,
            minSelect: 0,
            name: 'orderId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            hidden: false,
            id: 'discountAmount',
            max: null,
            min: 0,
            name: 'discountAmount',
            onlyInt: false,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
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
          }
        ],
        indexes: [
          'CREATE INDEX idx_promo_code_usages_promo ON promo_code_usages (promoCodeId)',
          'CREATE INDEX idx_promo_code_usages_order ON promo_code_usages (orderId)',
          'CREATE INDEX idx_promo_code_usages_email ON promo_code_usages (email)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: null,
        deleteRule: '@request.auth.id != ""'
      })
    )

    // service_sessions
    app.save(
      new Collection({
        id: 'pbc_service_sessions',
        name: 'service_sessions',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: [
              'break',
              'lunch',
              'registration',
              'networking',
              'sponsor',
              'announcement',
              'ceremony',
              'custom'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'title',
            max: 200,
            min: 1,
            name: 'title',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 2000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'icon',
            maxSelect: 1,
            name: 'icon',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: [
              'coffee',
              'utensils',
              'clipboard-check',
              'users',
              'megaphone',
              'info',
              'award',
              'star'
            ]
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'color',
            max: 7,
            min: 7,
            name: 'color',
            pattern: '^#[0-9A-Fa-f]{6}$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'date',
            max: '',
            min: '',
            name: 'date',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'startTime',
            max: 5,
            min: 5,
            name: 'startTime',
            pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'endTime',
            max: 5,
            min: 5,
            name: 'endTime',
            pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isGlobal',
            name: 'isGlobal',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'roomIds',
            maxSize: 2000000,
            name: 'roomIds',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'isPublic',
            name: 'isPublic',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'sortOrder',
            max: null,
            min: 0,
            name: 'sortOrder',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
        indexes: [
          'CREATE INDEX idx_service_sessions_edition ON service_sessions (editionId)',
          'CREATE INDEX idx_service_sessions_date ON service_sessions (date)',
          'CREATE INDEX idx_service_sessions_type ON service_sessions (type)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // calendar_invites
    app.save(
      new Collection({
        id: 'pbc_calendar_invites',
        name: 'calendar_invites',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3660498186',
            hidden: false,
            id: 'sessionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'sessionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 0,
            name: 'speakerId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'speakerEmail',
            max: 255,
            min: 5,
            name: 'speakerEmail',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'method',
            maxSelect: 1,
            name: 'method',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['REQUEST', 'CANCEL']
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['pending', 'sent', 'updated', 'cancelled', 'failed']
          },
          {
            hidden: false,
            id: 'sequence',
            max: null,
            min: 0,
            name: 'sequence',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'lastSentAt',
            max: '',
            min: '',
            name: 'lastSentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'error',
            max: 2000,
            min: 0,
            name: 'error',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
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
        indexes: [
          'CREATE INDEX idx_calendar_invites_session ON calendar_invites (sessionId)',
          'CREATE INDEX idx_calendar_invites_speaker ON calendar_invites (speakerId)',
          'CREATE UNIQUE INDEX idx_calendar_invites_session_speaker ON calendar_invites (sessionId, speakerId)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // feedback_templates
    app.save(
      new Collection({
        id: 'pbc_feedback_templates',
        name: 'feedback_templates',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['accepted', 'rejected', 'waitlisted', 'custom']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 200,
            min: 1,
            name: 'subject',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            convertURLs: false,
            hidden: false,
            id: 'body',
            maxSize: 50000,
            name: 'body',
            presentable: false,
            required: true,
            system: false,
            type: 'editor'
          },
          {
            hidden: false,
            id: 'includeReviewerComments',
            name: 'includeReviewerComments',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'isDefault',
            name: 'isDefault',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [
          'CREATE INDEX idx_feedback_templates_edition ON feedback_templates (editionId)',
          'CREATE INDEX idx_feedback_templates_type ON feedback_templates (type)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // notifications
    app.save(
      new Collection({
        id: 'pbc_notifications',
        name: 'notifications',
        type: 'base',
        system: false,
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
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'type',
            maxSelect: 1,
            name: 'type',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['system', 'alert', 'reminder', 'action']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'title',
            max: 200,
            min: 1,
            name: 'title',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'message',
            max: 1000,
            min: 1,
            name: 'message',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isRead',
            name: 'isRead',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'link',
            name: 'link',
            onlyDomains: null,
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            hidden: false,
            id: 'metadata',
            maxSize: 5000,
            name: 'metadata',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'deletedAt',
            max: '',
            min: '',
            name: 'deletedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE INDEX `idx_notifications_userId` ON `notifications` (`userId`)',
          'CREATE INDEX `idx_notifications_userId_isRead` ON `notifications` (`userId`, `isRead`)',
          'CREATE INDEX `idx_notifications_userId_type` ON `notifications` (`userId`, `type`)',
          'CREATE INDEX `idx_notifications_userId_deletedAt` ON `notifications` (`userId`, `deletedAt`)'
        ],
        listRule: 'userId = @request.auth.id',
        viewRule: 'userId = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: 'userId = @request.auth.id',
        deleteRule: 'userId = @request.auth.id'
      })
    )

    // speaker_feedbacks
    app.save(
      new Collection({
        id: 'pbc_speaker_feedbacks',
        name: 'speaker_feedbacks',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_2355380017',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 0,
            name: 'talkId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 0,
            name: 'speakerId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_feedback_templates',
            hidden: false,
            id: 'templateId',
            maxSelect: 1,
            minSelect: 0,
            name: 'templateId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'subject',
            max: 200,
            min: 1,
            name: 'subject',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            convertURLs: false,
            hidden: false,
            id: 'body',
            maxSize: 50000,
            name: 'body',
            presentable: false,
            required: true,
            system: false,
            type: 'editor'
          },
          {
            hidden: false,
            id: 'sentAt',
            max: '',
            min: '',
            name: 'sentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'status',
            maxSelect: 1,
            name: 'status',
            presentable: true,
            required: true,
            system: false,
            type: 'select',
            values: ['draft', 'sent', 'failed']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'error',
            max: 2000,
            min: 0,
            name: 'error',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_speaker_feedbacks_talk ON speaker_feedbacks (talkId)',
          'CREATE INDEX idx_speaker_feedbacks_speaker ON speaker_feedbacks (speakerId)',
          'CREATE INDEX idx_speaker_feedbacks_status ON speaker_feedbacks (status)',
          'CREATE UNIQUE INDEX idx_speaker_feedbacks_talk_speaker ON speaker_feedbacks (talkId, speakerId)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // cfp_settings
    app.save(
      new Collection({
        id: 'pbc_2176234591',
        name: 'cfp_settings',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            hidden: false,
            id: 'cfpOpenDate',
            max: '',
            min: '',
            name: 'cfpOpenDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'cfpCloseDate',
            max: '',
            min: '',
            name: 'cfpCloseDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'introText',
            max: 5000,
            min: 0,
            name: 'introText',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'maxSubmissionsPerSpeaker',
            max: 50,
            min: 1,
            name: 'maxSubmissionsPerSpeaker',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'requireAbstract',
            name: 'requireAbstract',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'requireDescription',
            name: 'requireDescription',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'allowCoSpeakers',
            name: 'allowCoSpeakers',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'anonymousReview',
            name: 'anonymousReview',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'revealSpeakersAfterDecision',
            name: 'revealSpeakersAfterDecision',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'reviewMode',
            maxSelect: 1,
            name: 'reviewMode',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['stars', 'yes_no', 'comparative']
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
          },
          {
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
          },
          {
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
          },
          {
            hidden: false,
            id: 'allowLimitExceptionRequest',
            name: 'allowLimitExceptionRequest',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          }
        ],
        indexes: ['CREATE UNIQUE INDEX `idx_cfp_settings_edition` ON `cfp_settings` (`editionId`)'],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // secret_links
    app.save(
      new Collection({
        id: 'pbc_3891245567',
        name: 'secret_links',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            autogeneratePattern: '',
            hidden: false,
            id: 'token',
            max: 50,
            min: 36,
            name: 'token',
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
            id: 'name',
            max: 100,
            min: 0,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'maxSubmissions',
            max: 100,
            min: 1,
            name: 'maxSubmissions',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'usedSubmissions',
            max: null,
            min: 0,
            name: 'usedSubmissions',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 1,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE UNIQUE INDEX `idx_secret_links_token` ON `secret_links` (`token`)',
          'CREATE INDEX `idx_secret_links_edition` ON `secret_links` (`editionId`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // budget_checklist_items
    app.save(
      new Collection({
        id: 'pbc_budget_checklist_items',
        name: 'budget_checklist_items',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1899532601',
            hidden: false,
            id: 'categoryId',
            maxSelect: 1,
            minSelect: 0,
            name: 'categoryId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 1000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'estimatedAmount',
            max: null,
            min: 0,
            name: 'estimatedAmount',
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
            values: ['pending', 'approved', 'ordered', 'paid', 'cancelled']
          },
          {
            hidden: false,
            id: 'priority',
            maxSelect: 1,
            name: 'priority',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['low', 'medium', 'high']
          },
          {
            hidden: false,
            id: 'dueDate',
            max: '',
            min: '',
            name: 'dueDate',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'assignee',
            max: 200,
            min: 0,
            name: 'assignee',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'notes',
            max: 2000,
            min: 0,
            name: 'notes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: 0,
            name: 'order',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1371503333',
            hidden: false,
            id: 'transactionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'transactionId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_checklist_items_edition ON budget_checklist_items (editionId)',
          'CREATE INDEX idx_checklist_items_category ON budget_checklist_items (categoryId)',
          'CREATE INDEX idx_checklist_items_status ON budget_checklist_items (editionId, status)',
          'CREATE INDEX idx_checklist_items_order ON budget_checklist_items (editionId, `order`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // evaluation_plans
    app.save(
      new Collection({
        id: 'pbc_4122456789',
        name: 'evaluation_plans',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_3292755704',
            hidden: false,
            id: 'categoryIds',
            maxSelect: 100,
            minSelect: 0,
            name: 'categoryIds',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'reviewerIds',
            maxSelect: 100,
            minSelect: 0,
            name: 'reviewerIds',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 1,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX `idx_evaluation_plans_edition` ON `evaluation_plans` (`editionId`)',
          'CREATE INDEX `idx_evaluation_plans_active` ON `evaluation_plans` (`editionId`, `isActive`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // setup_tokens
    app.save(
      new Collection({
        id: 'pbc_setup_tokens',
        name: 'setup_tokens',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'token',
            max: 0,
            min: 0,
            name: 'token',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'used',
            name: 'used',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'usedAt',
            max: '',
            min: '',
            name: 'usedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: ['CREATE UNIQUE INDEX idx_setup_tokens_token ON setup_tokens (token)'],
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null
      })
    )

    // budget_templates
    app.save(
      new Collection({
        id: 'pbc_budget_templates',
        name: 'budget_templates',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 1000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'eventType',
            maxSelect: 1,
            name: 'eventType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['conference', 'meetup', 'workshop', 'hackathon', 'other']
          },
          {
            hidden: false,
            id: 'isGlobal',
            name: 'isGlobal',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_2873630990',
            hidden: false,
            id: 'organizationId',
            maxSelect: 1,
            minSelect: 0,
            name: 'organizationId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'items',
            maxSize: 100000,
            name: 'items',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'usageCount',
            max: null,
            min: 0,
            name: 'usageCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_budget_templates_org ON budget_templates (organizationId)',
          'CREATE INDEX idx_budget_templates_global ON budget_templates (isGlobal)',
          'CREATE INDEX idx_budget_templates_type ON budget_templates (eventType)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // simulation_scenarios
    app.save(
      new Collection({
        id: 'pbc_simulation_scenarios',
        name: 'simulation_scenarios',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 200,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 1000,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'parameters',
            maxSize: 50000,
            name: 'parameters',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'results',
            maxSize: 50000,
            name: 'results',
            presentable: false,
            required: false,
            system: false,
            type: 'json'
          },
          {
            hidden: false,
            id: 'isBaseline',
            name: 'isBaseline',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'createdBy',
            maxSelect: 1,
            minSelect: 0,
            name: 'createdBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
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
        indexes: [
          'CREATE INDEX idx_simulation_scenarios_edition ON simulation_scenarios (editionId)',
          'CREATE INDEX idx_simulation_scenarios_baseline ON simulation_scenarios (editionId, isBaseline)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // participant_streaming_links
    app.save(
      new Collection({
        id: 'pbc_streaming_links',
        name: 'participant_streaming_links',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3660498186',
            hidden: false,
            id: 'sessionId',
            maxSelect: 1,
            minSelect: 1,
            name: 'sessionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'participantId',
            max: 50,
            min: 1,
            name: 'participantId',
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
            id: 'uniqueToken',
            max: 32,
            min: 32,
            name: 'uniqueToken',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'streamUrl',
            name: 'streamUrl',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'url'
          },
          {
            hidden: false,
            id: 'accessedAt',
            max: '',
            min: '',
            name: 'accessedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'accessCount',
            max: null,
            min: 0,
            name: 'accessCount',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'maxAccess',
            max: null,
            min: 1,
            name: 'maxAccess',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'expiresAt',
            max: '',
            min: '',
            name: 'expiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
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
        indexes: [
          'CREATE UNIQUE INDEX `idx_participant_streaming_token` ON `participant_streaming_links` (`uniqueToken`)',
          'CREATE INDEX `idx_participant_streaming_session` ON `participant_streaming_links` (`sessionId`)',
          'CREATE UNIQUE INDEX `idx_participant_streaming_session_participant` ON `participant_streaming_links` (`sessionId`, `participantId`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // waitlist_entries
    app.save(
      new Collection({
        id: 'pbc_waitlist_entries',
        name: 'waitlist_entries',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            collectionId: 'pbc_647540413',
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
            exceptDomains: null,
            hidden: false,
            id: 'email',
            name: 'email',
            onlyDomains: null,
            presentable: false,
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
            collectionId: 'pbc_3527180448',
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
        indexes: [
          'CREATE INDEX `idx_waitlist_edition` ON `waitlist_entries` (`editionId`)',
          'CREATE INDEX `idx_waitlist_ticket_type` ON `waitlist_entries` (`ticketTypeId`)',
          'CREATE INDEX `idx_waitlist_email` ON `waitlist_entries` (`email`)',
          'CREATE INDEX `idx_waitlist_status` ON `waitlist_entries` (`status`)',
          'CREATE INDEX `idx_waitlist_position` ON `waitlist_entries` (`ticketTypeId`, `position`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // waitlist_settings
    app.save(
      new Collection({
        id: 'pbc_waitlist_settings',
        name: 'waitlist_settings',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            hidden: false,
            id: 'isEnabled',
            name: 'isEnabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'purchaseWindowHours',
            max: 168,
            min: 1,
            name: 'purchaseWindowHours',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'maxEntriesPerEmail',
            max: 10,
            min: 1,
            name: 'maxEntriesPerEmail',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'notifyBatchSize',
            max: 100,
            min: 1,
            name: 'notifyBatchSize',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
          },
          {
            hidden: false,
            id: 'autoNotify',
            name: 'autoNotify',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'requireConfirmation',
            name: 'requireConfirmation',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
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
        indexes: [
          'CREATE UNIQUE INDEX `idx_waitlist_settings_edition` ON `waitlist_settings` (`editionId`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // agent_submissions
    app.save(
      new Collection({
        id: 'pbc_agent_submissions',
        name: 'agent_submissions',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3660498186',
            hidden: false,
            id: 'talkId',
            maxSelect: 1,
            minSelect: 1,
            name: 'talkId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: 'pbc_1636713223',
            hidden: false,
            id: 'speakerId',
            maxSelect: 1,
            minSelect: 1,
            name: 'speakerId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'submittedBy',
            maxSelect: 1,
            minSelect: 1,
            name: 'submittedBy',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'submittedByName',
            max: 100,
            min: 1,
            name: 'submittedByName',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: null,
            hidden: false,
            id: 'submittedByEmail',
            name: 'submittedByEmail',
            onlyDomains: null,
            presentable: false,
            required: true,
            system: false,
            type: 'email'
          },
          {
            hidden: false,
            id: 'origin',
            maxSelect: 1,
            name: 'origin',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['speaker', 'organizer', 'import', 'invitation']
          },
          {
            hidden: false,
            id: 'validationStatus',
            maxSelect: 1,
            name: 'validationStatus',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['pending', 'validated', 'rejected', 'expired']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'validationToken',
            max: 32,
            min: 32,
            name: 'validationToken',
            pattern: '^[a-z0-9]+$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'validationExpiresAt',
            max: '',
            min: '',
            name: 'validationExpiresAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'validatedAt',
            max: '',
            min: '',
            name: 'validatedAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'validationNotes',
            max: 500,
            min: 0,
            name: 'validationNotes',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'notificationSentAt',
            max: '',
            min: '',
            name: 'notificationSentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'reminderSentAt',
            max: '',
            min: '',
            name: 'reminderSentAt',
            presentable: false,
            required: false,
            system: false,
            type: 'date'
          },
          {
            hidden: false,
            id: 'originalContent',
            maxSize: 50000,
            name: 'originalContent',
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
        indexes: [
          'CREATE INDEX `idx_agent_submission_talk` ON `agent_submissions` (`talkId`)',
          'CREATE INDEX `idx_agent_submission_speaker` ON `agent_submissions` (`speakerId`)',
          'CREATE INDEX `idx_agent_submission_status` ON `agent_submissions` (`validationStatus`)',
          'CREATE UNIQUE INDEX `idx_agent_submission_token` ON `agent_submissions` (`validationToken`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // field_condition_rules
    app.save(
      new Collection({
        id: 'pbc_3605007360',
        name: 'field_condition_rules',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
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
            autogeneratePattern: '',
            hidden: false,
            id: 'targetFieldId',
            max: 100,
            min: 1,
            name: 'targetFieldId',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'name',
            max: 100,
            min: 1,
            name: 'name',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'description',
            max: 500,
            min: 0,
            name: 'description',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'conditions',
            maxSize: 50000,
            name: 'conditions',
            presentable: false,
            required: true,
            system: false,
            type: 'json'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'conditionLogic',
            max: 3,
            min: 2,
            name: 'conditionLogic',
            pattern: '^(AND|OR)$',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'isActive',
            name: 'isActive',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'order',
            max: null,
            min: 0,
            name: 'order',
            onlyInt: true,
            presentable: false,
            required: false,
            system: false,
            type: 'number'
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
        indexes: [
          'CREATE INDEX `idx_field_condition_rules_edition` ON `field_condition_rules` (`editionId`)',
          'CREATE INDEX `idx_field_condition_rules_target` ON `field_condition_rules` (`editionId`, `targetFieldId`)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      })
    )

    // session_feedback
    app.save(
      new Collection({
        id: 'pbc_session_feedback',
        name: 'session_feedback',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3660498186',
            hidden: false,
            id: 'sessionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'sessionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            cascadeDelete: true,
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'sf_userId',
            max: 100,
            min: 1,
            name: 'userId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'ratingMode',
            maxSelect: 1,
            name: 'ratingMode',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['stars', 'scale_10', 'thumbs', 'yes_no']
          },
          {
            hidden: false,
            id: 'numericValue',
            max: 10,
            min: 0,
            name: 'numericValue',
            onlyInt: true,
            presentable: false,
            required: true,
            system: false,
            type: 'number'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'sf_comment',
            max: 2000,
            min: 0,
            name: 'comment',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389176',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085495',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        indexes: ['CREATE UNIQUE INDEX idx_session_user ON session_feedback (sessionId, userId)'],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '',
        updateRule: null,
        deleteRule: '@request.auth.id != ""'
      })
    )

    // event_feedback
    app.save(
      new Collection({
        id: 'pbc_event_feedback',
        name: 'event_feedback',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'ef_editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ef_userId',
            max: 100,
            min: 1,
            name: 'userId',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'feedbackType',
            maxSelect: 1,
            name: 'feedbackType',
            presentable: false,
            required: true,
            system: false,
            type: 'select',
            values: ['general', 'problem']
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ef_subject',
            max: 200,
            min: 0,
            name: 'subject',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ef_message',
            max: 5000,
            min: 1,
            name: 'message',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: true,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'ef_status',
            maxSelect: 1,
            name: 'status',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['open', 'acknowledged', 'resolved', 'closed']
          },
          {
            hidden: false,
            id: 'autodate2990389177',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085496',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        indexes: [],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // feedback_settings
    app.save(
      new Collection({
        id: 'pbc_feedback_settings',
        name: 'feedback_settings',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'fs_editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            hidden: false,
            id: 'sessionRatingEnabled',
            name: 'sessionRatingEnabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'sessionRatingMode',
            maxSelect: 1,
            name: 'sessionRatingMode',
            presentable: false,
            required: false,
            system: false,
            type: 'select',
            values: ['stars', 'scale_10', 'thumbs', 'yes_no']
          },
          {
            hidden: false,
            id: 'sessionCommentRequired',
            name: 'sessionCommentRequired',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'eventFeedbackEnabled',
            name: 'eventFeedbackEnabled',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'feedbackIntroText',
            max: 2000,
            min: 0,
            name: 'feedbackIntroText',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389178',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085497',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_feedback_settings_edition ON feedback_settings (editionId)'
        ],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // ticket_templates
    app.save(
      new Collection({
        id: 'pbc_ticket_templates',
        name: 'ticket_templates',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'tt_editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'primaryColor',
            max: 7,
            min: 0,
            name: 'primaryColor',
            pattern: '^#[0-9A-Fa-f]{6}$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'backgroundColor',
            max: 7,
            min: 0,
            name: 'backgroundColor',
            pattern: '^#[0-9A-Fa-f]{6}$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'textColor',
            max: 7,
            min: 0,
            name: 'textColor',
            pattern: '^#[0-9A-Fa-f]{6}$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'accentColor',
            max: 7,
            min: 0,
            name: 'accentColor',
            pattern: '^#[0-9A-Fa-f]{6}$',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            exceptDomains: [],
            hidden: false,
            id: 'logoUrl',
            name: 'logoUrl',
            onlyDomains: [],
            presentable: false,
            required: false,
            system: false,
            type: 'url'
          },
          {
            hidden: false,
            id: 'logoFile',
            maxSelect: 1,
            maxSize: 2097152,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            name: 'logoFile',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['300x0'],
            type: 'file'
          },
          {
            hidden: false,
            id: 'showVenue',
            name: 'showVenue',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'showDate',
            name: 'showDate',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'showQrCode',
            name: 'showQrCode',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'customFooterText',
            max: 200,
            min: 0,
            name: 'customFooterText',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'autodate2990389179',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085498',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_ticket_templates_edition ON ticket_templates (editionId)'
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // pwa_settings
    app.save(
      new Collection({
        id: 'pbc_pwa_settings',
        name: 'pwa_settings',
        type: 'base',
        system: false,
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
            collectionId: 'pbc_3605007359',
            hidden: false,
            id: 'ps_editionId',
            maxSelect: 1,
            minSelect: 0,
            name: 'editionId',
            presentable: false,
            required: true,
            system: false,
            type: 'relation'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ps_title',
            max: 100,
            min: 0,
            name: 'title',
            pattern: '',
            presentable: true,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ps_subtitle',
            max: 200,
            min: 0,
            name: 'subtitle',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'ps_logoFile',
            maxSelect: 1,
            maxSize: 2097152,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
            name: 'logoFile',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['200x0', '400x0'],
            type: 'file'
          },
          {
            hidden: false,
            id: 'ps_headerImage',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            name: 'headerImage',
            presentable: false,
            protected: false,
            required: false,
            system: false,
            thumbs: ['800x0', '1200x0'],
            type: 'file'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ps_primaryColor',
            max: 7,
            min: 0,
            name: 'primaryColor',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ps_accentColor',
            max: 7,
            min: 0,
            name: 'accentColor',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'ps_showScheduleTab',
            name: 'showScheduleTab',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'ps_showSpeakersTab',
            name: 'showSpeakersTab',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'ps_showTicketsTab',
            name: 'showTicketsTab',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'ps_showFeedbackTab',
            name: 'showFeedbackTab',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'ps_showFavoritesTab',
            name: 'showFavoritesTab',
            presentable: false,
            required: false,
            system: false,
            type: 'bool'
          },
          {
            hidden: false,
            id: 'autodate2990389180',
            name: 'created',
            onCreate: true,
            onUpdate: false,
            presentable: false,
            system: false,
            type: 'autodate'
          },
          {
            hidden: false,
            id: 'autodate3332085499',
            name: 'updated',
            onCreate: true,
            onUpdate: true,
            presentable: false,
            system: false,
            type: 'autodate'
          }
        ],
        indexes: ['CREATE UNIQUE INDEX idx_pwa_settings_edition ON pwa_settings (editionId)'],
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""'
      })
    )

    // user_sessions
    app.save(
      new Collection({
        id: 'pbc_2480489570',
        name: 'user_sessions',
        type: 'base',
        system: false,
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
            autogeneratePattern: '',
            hidden: false,
            id: 'tokenHash',
            max: 0,
            min: 0,
            name: 'tokenHash',
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
            id: 'userAgent',
            max: 0,
            min: 0,
            name: 'userAgent',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'ipAddress',
            max: 0,
            min: 0,
            name: 'ipAddress',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'browser',
            max: 0,
            min: 0,
            name: 'browser',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'browserVersion',
            max: 0,
            min: 0,
            name: 'browserVersion',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'os',
            max: 0,
            min: 0,
            name: 'os',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'osVersion',
            max: 0,
            min: 0,
            name: 'osVersion',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'device',
            max: 0,
            min: 0,
            name: 'device',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'city',
            max: 0,
            min: 0,
            name: 'city',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            autogeneratePattern: '',
            hidden: false,
            id: 'country',
            max: 0,
            min: 0,
            name: 'country',
            pattern: '',
            presentable: false,
            primaryKey: false,
            required: false,
            system: false,
            type: 'text'
          },
          {
            hidden: false,
            id: 'lastActive',
            max: '',
            min: '',
            name: 'lastActive',
            presentable: false,
            required: true,
            system: false,
            type: 'date'
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
          },
          {
            cascadeDelete: false,
            collectionId: '_pb_users_auth_',
            hidden: false,
            id: 'userId',
            maxSelect: 1,
            minSelect: 0,
            name: 'userId',
            presentable: false,
            required: false,
            system: false,
            type: 'relation'
          }
        ],
        indexes: [],
        listRule: '@request.auth.id = userId',
        viewRule: '@request.auth.id = userId',
        createRule: '@request.auth.id != "" && @request.body.userId = @request.auth.id',
        updateRule: '@request.auth.id = userId',
        deleteRule: '@request.auth.id = userId'
      })
    )
  },
  (app) => {
    // Down migration - delete in reverse order
    const names = [
      'user_sessions',
      'pwa_settings',
      'ticket_templates',
      'feedback_settings',
      'event_feedback',
      'session_feedback',
      'field_condition_rules',
      'agent_submissions',
      'waitlist_settings',
      'waitlist_entries',
      'participant_streaming_links',
      'simulation_scenarios',
      'budget_templates',
      'setup_tokens',
      'evaluation_plans',
      'budget_checklist_items',
      'secret_links',
      'cfp_settings',
      'speaker_feedbacks',
      'notifications',
      'feedback_templates',
      'calendar_invites',
      'service_sessions',
      'promo_code_usages',
      'promo_codes',
      'automation_logs',
      'automation_enrollments',
      'automation_steps',
      'automations',
      'ab_test_variants',
      'ab_test_campaigns',
      'library_templates',
      'contact_merge_history',
      'contact_event_participations',
      'duplicate_pairs',
      'lead_score_history',
      'lead_scoring_rules',
      'contact_custom_values',
      'custom_fields',
      'data_retention_policies',
      'communication_preferences',
      'consent_audit_logs',
      'contact_activities',
      'suppression_list',
      'segment_memberships',
      'sponsor_assets',
      'email_events',
      'webhook_deliveries',
      'webhooks',
      'api_request_logs',
      'api_keys',
      'sponsor_inquiries',
      'report_configs',
      'alerts',
      'alert_thresholds',
      'team_members',
      'sponsor_messages',
      'sponsor_deliverables',
      'sponsor_tokens',
      'edition_sponsors',
      'sponsor_packages',
      'sponsors',
      'financial_audit_log',
      'speaker_tokens',
      'sessions',
      'tracks',
      'slots',
      'segments',
      'room_assignments',
      'rooms',
      'reviews',
      'reimbursement_items',
      'reimbursement_requests',
      'organization_members',
      'organization_invitations',
      'order_items',
      'email_templates',
      'email_logs',
      'email_campaigns',
      'contacts',
      'contact_edition_links',
      'consents',
      'comments',
      'talks',
      'speakers',
      'formats',
      'categories',
      'budget_quotes',
      'budget_invoices',
      'budget_transactions',
      'budget_categories',
      'edition_budgets',
      'billing_tickets',
      'ticket_types',
      'orders',
      'editions',
      'events',
      'organizations',
      'app_settings'
    ]
    for (const name of names) {
      try {
        const col = app.findCollectionByNameOrId(name)
        if (col) app.delete(col)
      } catch (e) {
        /* ignore */
      }
    }
  }
)
