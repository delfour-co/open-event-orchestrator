/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2480489570')

    // update collection data
    unmarshal(
      {
        createRule: '@request.auth.id != "" && @request.body.userId = @request.auth.id',
        deleteRule: '@request.auth.id = userId',
        listRule: '@request.auth.id = userId',
        updateRule: '@request.auth.id = userId',
        viewRule: '@request.auth.id = userId'
      },
      collection
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2480489570')

    // update collection data
    unmarshal(
      {
        createRule: null,
        deleteRule: '',
        listRule: '',
        updateRule: null,
        viewRule: ''
      },
      collection
    )

    return app.save(collection)
  }
)
