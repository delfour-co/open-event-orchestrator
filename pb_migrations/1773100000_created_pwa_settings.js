/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create pwa_settings collection
 *
 * Stores per-edition PWA appearance and feature settings
 */
migrate(
  (app) => {
    const editionsCollection = app.findCollectionByNameOrId('editions')

    const pwaSettings = new Collection({
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
          collectionId: editionsCollection.id,
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
    app.save(pwaSettings)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('pbc_pwa_settings')
      app.delete(collection)
    } catch (e) {
      // Collection may not exist
    }
  }
)
