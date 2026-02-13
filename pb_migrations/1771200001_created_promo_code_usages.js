/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      listRule: '@request.auth.id != ""',
      updateRule: null,
      viewRule: '@request.auth.id != ""',
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
          autogeneratePattern: '',
          hidden: false,
          id: 'email',
          max: 0,
          min: 0,
          name: 'email',
          pattern: '',
          presentable: false,
          primaryKey: false,
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
      id: 'pbc_promo_code_usages',
      indexes: [
        'CREATE INDEX idx_promo_code_usages_promo ON promo_code_usages (promoCodeId)',
        'CREATE INDEX idx_promo_code_usages_order ON promo_code_usages (orderId)',
        'CREATE INDEX idx_promo_code_usages_email ON promo_code_usages (email)'
      ],
      name: 'promo_code_usages',
      system: false,
      type: 'base'
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_promo_code_usages')

    return app.delete(collection)
  }
)
