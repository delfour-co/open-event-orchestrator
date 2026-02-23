/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Add B2B billing fields to sponsors collection
 * and vatRate to organizations collection.
 */
migrate(
  (app) => {
    // --- Sponsor billing fields ---
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

    // --- Organization vatRate field ---
    const organizations = app.findCollectionByNameOrId('organizations')
    organizations.fields.addMarshaledJSON(
      JSON.stringify([{ type: 'number', name: 'vatRate', min: 0, max: 100 }])
    )
    app.save(organizations)
  },
  (app) => {
    const sponsors = app.findCollectionByNameOrId('sponsors')
    const fieldsToRemove = [
      'legalName',
      'vatNumber',
      'siret',
      'billingAddress',
      'billingCity',
      'billingPostalCode',
      'billingCountry'
    ]
    for (const fieldName of fieldsToRemove) {
      const field = sponsors.fields.getByName(fieldName)
      if (field) sponsors.fields.removeById(field.id)
    }
    app.save(sponsors)

    const organizations = app.findCollectionByNameOrId('organizations')
    const vatField = organizations.fields.getByName('vatRate')
    if (vatField) organizations.fields.removeById(vatField.id)
    app.save(organizations)
  }
)
