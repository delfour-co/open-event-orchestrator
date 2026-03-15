import { describe, expect, it } from 'vitest'
import { DEFAULT_APP_SETTINGS, appSettingsSchema } from './app-settings'

describe('AppSettings domain', () => {
  describe('appSettingsSchema', () => {
    it('should validate a complete valid settings object', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1',
        title: 'My Event',
        subtitle: 'Annual Conference',
        logoFile: 'logo.png',
        headerImage: 'header.jpg',
        primaryColor: '#3b82f6',
        accentColor: '#8b5cf6',
        showScheduleTab: true,
        showSpeakersTab: true,
        showTicketsTab: true,
        showFeedbackTab: true,
        showFavoritesTab: true,
        showNetworkingTab: false,
        floorAmenities: [{ floor: 'Ground', amenities: ['toilets', 'elevator'] }]
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1'
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject title longer than 100 characters', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1',
        title: 'A'.repeat(101)
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject subtitle longer than 200 characters', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1',
        subtitle: 'A'.repeat(201)
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject primaryColor longer than 7 characters', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1',
        primaryColor: '#1234567890'
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should default boolean tabs when not provided', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1'
      }

      const result = appSettingsSchema.parse(data)
      expect(result.showScheduleTab).toBe(true)
      expect(result.showNetworkingTab).toBe(false)
      expect(result.floorAmenities).toEqual([])
    })

    it('should validate floorAmenities array', () => {
      const data = {
        id: 'settings1',
        editionId: 'ed1',
        floorAmenities: [
          { floor: '1F', amenities: ['toilets', 'elevator'] },
          { floor: '2F', amenities: ['cafeteria'] }
        ]
      }

      const result = appSettingsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('DEFAULT_APP_SETTINGS', () => {
    it('should have correct default primary color', () => {
      expect(DEFAULT_APP_SETTINGS.primaryColor).toBe('#3b82f6')
    })

    it('should have correct default accent color', () => {
      expect(DEFAULT_APP_SETTINGS.accentColor).toBe('#8b5cf6')
    })

    it('should enable schedule tab by default', () => {
      expect(DEFAULT_APP_SETTINGS.showScheduleTab).toBe(true)
    })

    it('should disable networking tab by default', () => {
      expect(DEFAULT_APP_SETTINGS.showNetworkingTab).toBe(false)
    })

    it('should have empty floor amenities by default', () => {
      expect(DEFAULT_APP_SETTINGS.floorAmenities).toEqual([])
    })
  })
})
