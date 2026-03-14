/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add created/updated auto-fields to audit_logs if missing
    const collection = app.findCollectionByNameOrId('audit_logs')
    const fieldNames = collection.fields.map((f) => f.name)

    const missing = []
    if (!fieldNames.includes('created')) {
      missing.push({
        type: 'autodate',
        name: 'created',
        onCreate: true,
        onUpdate: false
      })
    }
    if (!fieldNames.includes('updated')) {
      missing.push({
        type: 'autodate',
        name: 'updated',
        onCreate: true,
        onUpdate: true
      })
    }

    if (missing.length > 0) {
      collection.fields.addMarshaledJSON(JSON.stringify(missing))
      app.save(collection)
    }

    // Also fix user_totp_secrets and trusted_devices if needed
    for (const name of ['user_totp_secrets', 'trusted_devices']) {
      try {
        const col = app.findCollectionByNameOrId(name)
        const names = col.fields.map((f) => f.name)
        const toAdd = []
        if (!names.includes('created')) {
          toAdd.push({ type: 'autodate', name: 'created', onCreate: true, onUpdate: false })
        }
        if (!names.includes('updated')) {
          toAdd.push({ type: 'autodate', name: 'updated', onCreate: true, onUpdate: true })
        }
        if (toAdd.length > 0) {
          col.fields.addMarshaledJSON(JSON.stringify(toAdd))
          app.save(col)
        }
      } catch {}
    }
  },
  (app) => {}
)
