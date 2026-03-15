/// <reference path="../pb_data/types.d.ts" />
/**
 * Consolidated migration: all schema updates from v1.2.0 development
 * (previously migrations 0002 through 0037 + 1773524368)
 *
 * This single migration applies every field addition, collection creation,
 * API rule update, settings configuration, and data migration that was
 * previously spread across 33 incremental migration files.
 */
migrate(
  (app) => {
    // =========================================================================
    // 1. FIELD ADDITIONS TO EXISTING COLLECTIONS
    // =========================================================================

    // --- sponsors: B2B billing fields (was 0002) ---
    const sponsors = app.findCollectionByNameOrId('sponsors')
    sponsors.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'legalName', max: 300 },
        { type: 'text', name: 'vatNumber', max: 50 },
        { type: 'text', name: 'siret', max: 20 },
        { type: 'text', name: 'billingAddress', max: 500 },
        { type: 'text', name: 'billingCity', max: 100 },
        { type: 'text', name: 'billingPostalCode', max: 20 },
        { type: 'text', name: 'billingCountry', max: 100 }
      ])
    )
    app.save(sponsors)

    // --- organizations: vatRate, legal fields, branding, social, locale (was 0002, 0008, 0009, 0021, 0029) ---
    const organizations = app.findCollectionByNameOrId('organizations')
    organizations.fields.addMarshaledJSON(
      JSON.stringify([
        // vatRate (0002)
        { type: 'number', name: 'vatRate', min: 0, max: 100 },
        // legal fields (0008)
        { type: 'text', name: 'legalName', required: false, max: 300 },
        { type: 'text', name: 'siret', required: false, max: 20 },
        { type: 'text', name: 'vatNumber', required: false, max: 50 },
        { type: 'text', name: 'address', required: false, max: 500 },
        { type: 'text', name: 'city', required: false, max: 100 },
        { type: 'text', name: 'postalCode', required: false, max: 20 },
        { type: 'text', name: 'country', required: false, max: 100 },
        // legal form, rcs, capital (0009)
        { type: 'text', name: 'legalForm', required: false, max: 50 },
        { type: 'text', name: 'rcsNumber', required: false, max: 50 },
        { type: 'text', name: 'shareCapital', required: false, max: 50 },
        // branding & social (0021)
        { type: 'text', name: 'primaryColor', required: false },
        { type: 'text', name: 'secondaryColor', required: false },
        { type: 'url', name: 'twitter', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'linkedin', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'github', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'youtube', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'text', name: 'timezone', required: false },
        { type: 'text', name: 'defaultLocale', required: false },
        // restored missing fields (0029)
        {
          type: 'file',
          name: 'logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          required: false,
          thumbs: ['100x100', '200x200', '400x400']
        },
        { type: 'url', name: 'website', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'email', name: 'contactEmail', required: false },
        { type: 'text', name: 'ownerId', required: false }
      ])
    )
    app.save(organizations)

    // --- events: branding, social, policies, restored fields (was 0022, 0029) ---
    const events = app.findCollectionByNameOrId('events')
    events.fields.addMarshaledJSON(
      JSON.stringify([
        // branding & social (0022)
        {
          type: 'file',
          name: 'banner',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          required: false,
          thumbs: []
        },
        { type: 'text', name: 'primaryColor', required: false },
        { type: 'text', name: 'secondaryColor', required: false },
        { type: 'url', name: 'twitter', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'url', name: 'linkedin', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'text', name: 'hashtag', required: false },
        { type: 'email', name: 'contactEmail', required: false },
        {
          type: 'url',
          name: 'codeOfConductUrl',
          required: false,
          exceptDomains: [],
          onlyDomains: []
        },
        {
          type: 'url',
          name: 'privacyPolicyUrl',
          required: false,
          exceptDomains: [],
          onlyDomains: []
        },
        { type: 'text', name: 'timezone', required: false },
        // restored missing fields (0029)
        {
          type: 'file',
          name: 'logo',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          required: false,
          thumbs: ['100x100', '200x200', '400x400']
        },
        { type: 'url', name: 'website', required: false, exceptDomains: [], onlyDomains: [] },
        { type: 'text', name: 'defaultVenue', required: false },
        { type: 'text', name: 'defaultCity', required: false },
        { type: 'text', name: 'defaultCountry', required: false }
      ])
    )
    app.save(events)

    // --- editions: legal documents (was 0016) ---
    const editions = app.findCollectionByNameOrId('editions')
    editions.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'termsOfSale', required: false, max: 50000 },
        { type: 'text', name: 'codeOfConduct', required: false, max: 50000 },
        { type: 'text', name: 'privacyPolicy', required: false, max: 50000 }
      ])
    )
    app.save(editions)

    // --- edition_sponsors: stripe PI, refunded status, invoiceNumber, paymentProvider, poNumber, invoicePdf (was 0003, 0007, 0011, 0013, 0015) ---
    const editionSponsors = app.findCollectionByNameOrId('edition_sponsors')
    editionSponsors.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'invoiceNumber', max: 30 },
        { type: 'text', name: 'stripePaymentIntentId', required: false },
        {
          id: 'status',
          type: 'select',
          name: 'status',
          required: true,
          maxSelect: 1,
          values: [
            'prospect',
            'contacted',
            'negotiating',
            'confirmed',
            'declined',
            'cancelled',
            'refunded'
          ]
        },
        { type: 'text', name: 'paymentProvider', required: false, max: 20 },
        { type: 'text', name: 'poNumber', required: false, max: 50 },
        {
          type: 'file',
          name: 'invoicePdf',
          required: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf']
        }
      ])
    )
    app.save(editionSponsors)

    // --- orders: invoiceNumber, paymentProvider, billing address, invoicePdf (was 0003, 0011, 0012, 0015) ---
    const orders = app.findCollectionByNameOrId('orders')
    orders.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'invoiceNumber', max: 30 },
        { type: 'text', name: 'paymentProvider', required: false, max: 20 },
        { type: 'text', name: 'billingAddress', required: false, max: 500 },
        { type: 'text', name: 'billingCity', required: false, max: 100 },
        { type: 'text', name: 'billingPostalCode', required: false, max: 20 },
        { type: 'text', name: 'billingCountry', required: false, max: 100 },
        {
          type: 'file',
          name: 'invoicePdf',
          required: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf']
        }
      ])
    )
    app.save(orders)

    // --- budget_invoices: file field text->file (was 0006) ---
    const budgetInvoices = app.findCollectionByNameOrId('budget_invoices')
    const oldFileField = budgetInvoices.fields.getByName('file')
    if (oldFileField) budgetInvoices.fields.removeById(oldFileField.id)
    budgetInvoices.fields.addMarshaledJSON(
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
    app.save(budgetInvoices)

    // --- pwa_settings: networkingTab, floorAmenities (was 0017, 0018) ---
    const pwaSettings = app.findCollectionByNameOrId('pwa_settings')
    pwaSettings.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'bool', name: 'showNetworkingTab', required: false },
        { type: 'json', name: 'floorAmenities', maxSize: 0, required: false }
      ])
    )
    app.save(pwaSettings)

    // --- event_feedback: numericValue (was 0019) ---
    const eventFeedback = app.findCollectionByNameOrId('event_feedback')
    eventFeedback.fields.addMarshaledJSON(
      JSON.stringify([{ type: 'number', name: 'numericValue', min: 1, max: 5, required: false }])
    )
    app.save(eventFeedback)

    // --- organization_invitations: token, lastSentAt (was 0020) ---
    const orgInvitations = app.findCollectionByNameOrId('organization_invitations')
    orgInvitations.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'token', required: false },
        { type: 'date', name: 'lastSentAt', required: false }
      ])
    )
    orgInvitations.indexes = orgInvitations.indexes || []
    orgInvitations.indexes.push(
      'CREATE UNIQUE INDEX idx_invitation_token ON organization_invitations (token) WHERE token != ""'
    )
    app.save(orgInvitations)

    // --- users: notificationPreferences, unified role values (was 0020b, 0034) ---
    const users = app.findCollectionByNameOrId('users')
    users.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'json', name: 'notificationPreferences', maxSize: 2000000, required: false },
        {
          id: 'role',
          type: 'select',
          name: 'role',
          required: false,
          maxSelect: 1,
          values: ['super_admin', 'admin', 'organizer', 'reviewer', 'speaker', 'attendee']
        }
      ])
    )
    app.save(users)

    // --- app_settings: helloasso, oauth, general, S3, backups, rate limiting, log retention (was 0010, 0035, 0036, 0037) ---
    const appSettings = app.findCollectionByNameOrId('app_settings')
    appSettings.fields.addMarshaledJSON(
      JSON.stringify([
        // HelloAsso (0010)
        { type: 'text', name: 'helloassoClientId', required: false, max: 200 },
        { type: 'text', name: 'helloassoClientSecret', required: false, max: 200 },
        { type: 'text', name: 'helloassoOrgSlug', required: false, max: 100 },
        { type: 'bool', name: 'helloassoEnabled', required: false },
        { type: 'bool', name: 'helloassoSandbox', required: false },
        { type: 'text', name: 'activePaymentProvider', required: false, max: 20 },
        // OAuth (0035)
        { type: 'bool', name: 'oauth2Enabled', required: false },
        { type: 'text', name: 'googleOAuthClientId', required: false },
        { type: 'text', name: 'googleOAuthClientSecret', required: false },
        { type: 'text', name: 'githubOAuthClientId', required: false },
        { type: 'text', name: 'githubOAuthClientSecret', required: false },
        // General (0036)
        { type: 'text', name: 'appName', required: false },
        { type: 'url', name: 'appUrl', required: false },
        // S3 (0037)
        { type: 'bool', name: 's3Enabled', required: false },
        { type: 'text', name: 's3Bucket', required: false },
        { type: 'text', name: 's3Region', required: false },
        { type: 'text', name: 's3Endpoint', required: false },
        { type: 'text', name: 's3AccessKey', required: false },
        { type: 'text', name: 's3SecretKey', required: false },
        { type: 'bool', name: 's3ForcePathStyle', required: false },
        // Backups (0037)
        { type: 'bool', name: 'backupsEnabled', required: false },
        { type: 'text', name: 'backupsCron', required: false },
        { type: 'number', name: 'backupsMaxKeep', required: false },
        { type: 'bool', name: 'backupsUseS3', required: false },
        // Rate Limiting (0037)
        { type: 'number', name: 'rateLimitRequests', required: false },
        { type: 'number', name: 'rateLimitWindowSeconds', required: false },
        // Log Retention (0037)
        { type: 'number', name: 'auditLogRetentionDays', required: false },
        { type: 'number', name: 'apiLogRetentionDays', required: false }
      ])
    )
    app.save(appSettings)

    // =========================================================================
    // 2. NEW COLLECTIONS
    // =========================================================================

    // --- invoice_counters (was 0003, 0004, 0005) ---
    const invoiceCounters = new Collection({
      id: 'pbc_invoice_counters',
      name: 'invoice_counters',
      type: 'base',
      system: false,
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: null,
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
          hidden: false,
          id: 'lastNumber',
          max: null,
          min: 0,
          name: 'lastNumber',
          onlyInt: true,
          presentable: false,
          required: false,
          system: false,
          type: 'number'
        },
        {
          hidden: false,
          id: 'prefix',
          max: 20,
          min: 0,
          name: 'prefix',
          pattern: '',
          presentable: false,
          primaryKey: false,
          required: false,
          system: false,
          type: 'text',
          autogeneratePattern: ''
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_invoice_counters_org_prefix ON invoice_counters (organizationId, prefix)'
      ]
    })
    app.save(invoiceCounters)

    // --- processed_payment_events (was 0014) ---
    const processedPaymentEvents = new Collection({
      name: 'processed_payment_events',
      type: 'base',
      fields: [
        {
          type: 'text',
          name: 'eventId',
          required: true,
          presentable: true,
          max: 200
        },
        {
          type: 'text',
          name: 'provider',
          required: true,
          max: 20
        },
        {
          type: 'date',
          name: 'processedAt',
          required: true
        }
      ],
      indexes: ['CREATE UNIQUE INDEX idx_processed_event_id ON processed_payment_events (eventId)']
    })
    app.save(processedPaymentEvents)

    // --- user_totp_secrets (was 0024, 0026, 0031) ---
    const totpSecrets = new Collection()
    totpSecrets.name = 'user_totp_secrets'
    totpSecrets.type = 'base'
    totpSecrets.listRule = 'userId = @request.auth.id'
    totpSecrets.viewRule = 'userId = @request.auth.id'
    totpSecrets.createRule = '@request.auth.id != ""'
    totpSecrets.updateRule = 'userId = @request.auth.id'
    totpSecrets.deleteRule = 'userId = @request.auth.id'
    totpSecrets.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'userId', required: true },
        { type: 'text', name: 'secret', required: true },
        { type: 'bool', name: 'enabled', required: false },
        { type: 'json', name: 'backupCodes', required: false, maxSize: 2000000 },
        { type: 'date', name: 'enabledAt', required: false },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }
      ])
    )
    app.save(totpSecrets)

    // --- trusted_devices (was 0024, 0026, 0031) ---
    const trustedDevices = new Collection()
    trustedDevices.name = 'trusted_devices'
    trustedDevices.type = 'base'
    trustedDevices.listRule = 'userId = @request.auth.id'
    trustedDevices.viewRule = 'userId = @request.auth.id'
    trustedDevices.createRule = '@request.auth.id != ""'
    trustedDevices.updateRule = 'userId = @request.auth.id'
    trustedDevices.deleteRule = 'userId = @request.auth.id'
    trustedDevices.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'userId', required: true },
        { type: 'text', name: 'deviceHash', required: true },
        { type: 'date', name: 'expiresAt', required: true },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }
      ])
    )
    app.save(trustedDevices)

    // --- audit_logs (was 0025, 0026, 0031) ---
    const auditLogs = new Collection()
    auditLogs.name = 'audit_logs'
    auditLogs.type = 'base'
    auditLogs.listRule = '@request.auth.id != ""'
    auditLogs.viewRule = '@request.auth.id != ""'
    auditLogs.createRule = '@request.auth.id != ""'
    auditLogs.updateRule = ''
    auditLogs.deleteRule = ''
    auditLogs.fields.addMarshaledJSON(
      JSON.stringify([
        { type: 'text', name: 'organizationId', required: true },
        { type: 'text', name: 'userId', required: false },
        { type: 'text', name: 'userName', required: false },
        { type: 'text', name: 'action', required: true },
        { type: 'text', name: 'entityType', required: false },
        { type: 'text', name: 'entityId', required: false },
        { type: 'text', name: 'entityName', required: false },
        { type: 'json', name: 'details', required: false, maxSize: 2000000 },
        { type: 'text', name: 'ipAddress', required: false },
        { type: 'text', name: 'userAgent', required: false },
        { type: 'autodate', name: 'created', onCreate: true, onUpdate: false },
        { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true }
      ])
    )
    app.save(auditLogs)

    // =========================================================================
    // 3. POCKETBASE SETTINGS (SMTP, email templates)
    // =========================================================================

    // --- Configure SMTP for Mailpit in dev (was 0028) ---
    const settings = app.settings()

    if (!settings.smtp.host || settings.smtp.host === 'smtp.example.com') {
      settings.smtp.enabled = true
      settings.smtp.host = 'mailpit'
      settings.smtp.port = 1025
      settings.smtp.tls = false
      settings.smtp.authMethod = ''
      settings.smtp.username = ''
      settings.smtp.password = ''
      settings.smtp.localName = 'localhost'
    }

    if (!settings.meta.senderAddress || settings.meta.senderAddress === 'support@example.com') {
      settings.meta.senderName = 'Open Event Orchestrator'
      settings.meta.senderAddress = 'noreply@oeo.local'
    }

    if (!settings.meta.appURL || settings.meta.appURL === 'http://localhost:8090') {
      settings.meta.appURL = 'http://localhost:5173'
    }

    settings.meta.appName = 'Open Event Orchestrator'

    app.save(settings)

    // --- Update password reset email template (was 0028) ---
    try {
      const usersCollection = app.findCollectionByNameOrId('users')

      if (usersCollection.resetPasswordTemplate) {
        usersCollection.resetPasswordTemplate.body =
          '<p>Hello,</p>\n' +
          '<p>Click on the button below to reset your password.</p>\n' +
          '<p>\n' +
          '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
          '</p>\n' +
          "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
          '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
        app.save(usersCollection)
      } else if (usersCollection.options?.resetPasswordTemplate) {
        usersCollection.options.resetPasswordTemplate.body =
          '<p>Hello,</p>\n' +
          '<p>Click on the button below to reset your password.</p>\n' +
          '<p>\n' +
          '  <a class="btn" href="{APP_URL}/auth/reset-password/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n' +
          '</p>\n' +
          "<p><i>If you didn't ask to reset your password, you can ignore this email.</i></p>\n" +
          '<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>'
        app.save(usersCollection)
      }
    } catch (e) {
      console.log('[Migration 0002] Could not update reset template:', e)
    }

    // =========================================================================
    // 4. ENABLE OAUTH2 ON USERS COLLECTION (was 1773524368)
    // =========================================================================
    try {
      const usersAuth = app.findCollectionByNameOrId('_pb_users_auth_')
      unmarshal({ oauth2: { enabled: true } }, usersAuth)
      app.save(usersAuth)
    } catch (e) {
      console.log('[Migration 0002] Could not enable OAuth2:', e)
    }

    // =========================================================================
    // 5. DATA MIGRATION: unify role values (was 0032)
    // =========================================================================
    try {
      const orgAdmins = app.findRecordsByFilter('users', 'role = "org_admin"', '', 0, 0)
      for (const user of orgAdmins) {
        user.set('role', 'admin')
        app.save(user)
      }
      const orgMembers = app.findRecordsByFilter('users', 'role = "org_member"', '', 0, 0)
      for (const user of orgMembers) {
        user.set('role', 'organizer')
        app.save(user)
      }
    } catch (e) {
      // No data to migrate on fresh install
    }
  },
  (app) => {
    // Down migration: remove new collections, revert field additions
    // Note: this is a best-effort rollback for development use only

    // Delete new collections
    const collectionsToDelete = [
      'audit_logs',
      'trusted_devices',
      'user_totp_secrets',
      'processed_payment_events',
      'invoice_counters'
    ]
    for (const name of collectionsToDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch {}
    }

    // Revert users role field
    try {
      const users = app.findCollectionByNameOrId('users')
      users.fields.addMarshaledJSON(
        JSON.stringify([
          {
            id: 'role',
            type: 'select',
            name: 'role',
            required: false,
            maxSelect: 1,
            values: ['super_admin', 'org_admin', 'org_member', 'speaker', 'attendee']
          }
        ])
      )
      const notifField = users.fields.getByName('notificationPreferences')
      if (notifField) users.fields.removeById(notifField.id)
      app.save(users)
    } catch {}

    // Revert sponsors billing fields
    try {
      const sponsors = app.findCollectionByNameOrId('sponsors')
      for (const f of [
        'legalName',
        'vatNumber',
        'siret',
        'billingAddress',
        'billingCity',
        'billingPostalCode',
        'billingCountry'
      ]) {
        const field = sponsors.fields.getByName(f)
        if (field) sponsors.fields.removeById(field.id)
      }
      app.save(sponsors)
    } catch {}

    // Revert organizations fields
    try {
      const orgs = app.findCollectionByNameOrId('organizations')
      for (const f of [
        'vatRate',
        'legalName',
        'siret',
        'vatNumber',
        'address',
        'city',
        'postalCode',
        'country',
        'legalForm',
        'rcsNumber',
        'shareCapital',
        'primaryColor',
        'secondaryColor',
        'twitter',
        'linkedin',
        'github',
        'youtube',
        'timezone',
        'defaultLocale',
        'logo',
        'website',
        'contactEmail',
        'ownerId'
      ]) {
        const field = orgs.fields.getByName(f)
        if (field) orgs.fields.removeById(field.id)
      }
      app.save(orgs)
    } catch {}

    // Revert events fields
    try {
      const events = app.findCollectionByNameOrId('events')
      for (const f of [
        'banner',
        'primaryColor',
        'secondaryColor',
        'twitter',
        'linkedin',
        'hashtag',
        'contactEmail',
        'codeOfConductUrl',
        'privacyPolicyUrl',
        'timezone',
        'logo',
        'website',
        'defaultVenue',
        'defaultCity',
        'defaultCountry'
      ]) {
        const field = events.fields.getByName(f)
        if (field) events.fields.removeById(field.id)
      }
      app.save(events)
    } catch {}

    // Revert editions fields
    try {
      const editions = app.findCollectionByNameOrId('editions')
      for (const f of ['termsOfSale', 'codeOfConduct', 'privacyPolicy']) {
        const field = editions.fields.getByName(f)
        if (field) editions.fields.removeById(field.id)
      }
      app.save(editions)
    } catch {}

    // Revert edition_sponsors fields
    try {
      const es = app.findCollectionByNameOrId('edition_sponsors')
      for (const f of [
        'invoiceNumber',
        'stripePaymentIntentId',
        'paymentProvider',
        'poNumber',
        'invoicePdf'
      ]) {
        const field = es.fields.getByName(f)
        if (field) es.fields.removeById(field.id)
      }
      es.fields.addMarshaledJSON(
        JSON.stringify([
          {
            id: 'status',
            type: 'select',
            name: 'status',
            required: true,
            maxSelect: 1,
            values: ['prospect', 'contacted', 'negotiating', 'confirmed', 'declined', 'cancelled']
          }
        ])
      )
      app.save(es)
    } catch {}

    // Revert orders fields
    try {
      const orders = app.findCollectionByNameOrId('orders')
      for (const f of [
        'invoiceNumber',
        'paymentProvider',
        'billingAddress',
        'billingCity',
        'billingPostalCode',
        'billingCountry',
        'invoicePdf'
      ]) {
        const field = orders.fields.getByName(f)
        if (field) orders.fields.removeById(field.id)
      }
      app.save(orders)
    } catch {}

    // Revert budget_invoices file field
    try {
      const bi = app.findCollectionByNameOrId('budget_invoices')
      const fileField = bi.fields.getByName('file')
      if (fileField) bi.fields.removeById(fileField.id)
      bi.fields.addMarshaledJSON(
        JSON.stringify([{ type: 'text', id: 'file', name: 'file', required: false }])
      )
      app.save(bi)
    } catch {}

    // Revert pwa_settings fields
    try {
      const pwa = app.findCollectionByNameOrId('pwa_settings')
      for (const f of ['showNetworkingTab', 'floorAmenities']) {
        const field = pwa.fields.getByName(f)
        if (field) pwa.fields.removeById(field.id)
      }
      app.save(pwa)
    } catch {}

    // Revert event_feedback numericValue
    try {
      const ef = app.findCollectionByNameOrId('event_feedback')
      const field = ef.fields.getByName('numericValue')
      if (field) ef.fields.removeById(field.id)
      app.save(ef)
    } catch {}

    // Revert organization_invitations fields
    try {
      const oi = app.findCollectionByNameOrId('organization_invitations')
      for (const f of ['token', 'lastSentAt']) {
        const field = oi.fields.getByName(f)
        if (field) oi.fields.removeById(field.id)
      }
      oi.indexes = (oi.indexes || []).filter((idx) => !idx.includes('idx_invitation_token'))
      app.save(oi)
    } catch {}

    // Revert app_settings fields
    try {
      const as2 = app.findCollectionByNameOrId('app_settings')
      for (const f of [
        'helloassoClientId',
        'helloassoClientSecret',
        'helloassoOrgSlug',
        'helloassoEnabled',
        'helloassoSandbox',
        'activePaymentProvider',
        'oauth2Enabled',
        'googleOAuthClientId',
        'googleOAuthClientSecret',
        'githubOAuthClientId',
        'githubOAuthClientSecret',
        'appName',
        'appUrl',
        's3Enabled',
        's3Bucket',
        's3Region',
        's3Endpoint',
        's3AccessKey',
        's3SecretKey',
        's3ForcePathStyle',
        'backupsEnabled',
        'backupsCron',
        'backupsMaxKeep',
        'backupsUseS3',
        'rateLimitRequests',
        'rateLimitWindowSeconds',
        'auditLogRetentionDays',
        'apiLogRetentionDays'
      ]) {
        const field = as2.fields.getByName(f)
        if (field) as2.fields.removeById(field.id)
      }
      app.save(as2)
    } catch {}

    // Revert OAuth2 on users
    try {
      const usersAuth = app.findCollectionByNameOrId('_pb_users_auth_')
      unmarshal({ oauth2: { enabled: false } }, usersAuth)
      app.save(usersAuth)
    } catch {}
  }
)
