/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    collection.fields.addMarshaledJSON(
      JSON.stringify([
        // S3
        { type: 'bool', name: 's3Enabled', required: false },
        { type: 'text', name: 's3Bucket', required: false },
        { type: 'text', name: 's3Region', required: false },
        { type: 'text', name: 's3Endpoint', required: false },
        { type: 'text', name: 's3AccessKey', required: false },
        { type: 'text', name: 's3SecretKey', required: false },
        { type: 'bool', name: 's3ForcePathStyle', required: false },
        // Backups
        { type: 'bool', name: 'backupsEnabled', required: false },
        { type: 'text', name: 'backupsCron', required: false },
        { type: 'number', name: 'backupsMaxKeep', required: false },
        { type: 'bool', name: 'backupsUseS3', required: false },
        // Rate Limiting
        { type: 'number', name: 'rateLimitRequests', required: false },
        { type: 'number', name: 'rateLimitWindowSeconds', required: false },
        // Log Retention
        { type: 'number', name: 'auditLogRetentionDays', required: false },
        { type: 'number', name: 'apiLogRetentionDays', required: false }
      ])
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')
    // S3
    collection.fields.removeByName('s3Enabled')
    collection.fields.removeByName('s3Bucket')
    collection.fields.removeByName('s3Region')
    collection.fields.removeByName('s3Endpoint')
    collection.fields.removeByName('s3AccessKey')
    collection.fields.removeByName('s3SecretKey')
    collection.fields.removeByName('s3ForcePathStyle')
    // Backups
    collection.fields.removeByName('backupsEnabled')
    collection.fields.removeByName('backupsCron')
    collection.fields.removeByName('backupsMaxKeep')
    collection.fields.removeByName('backupsUseS3')
    // Rate Limiting
    collection.fields.removeByName('rateLimitRequests')
    collection.fields.removeByName('rateLimitWindowSeconds')
    // Log Retention
    collection.fields.removeByName('auditLogRetentionDays')
    collection.fields.removeByName('apiLogRetentionDays')
    app.save(collection)
  }
)
