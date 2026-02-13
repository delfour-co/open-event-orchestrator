import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TICKET_TEMPLATE,
  getContrastColor,
  hexToRgb,
  isValidHexColor,
  ticketTemplateSchema
} from './ticket-template'

describe('ticket-template', () => {
  describe('ticketTemplateSchema', () => {
    it('should validate a valid ticket template', () => {
      const template = {
        id: 'template-1',
        editionId: 'edition-1',
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        showVenue: true,
        showDate: true,
        showQrCode: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = ticketTemplateSchema.safeParse(template)
      expect(result.success).toBe(true)
    })

    it('should reject invalid hex color', () => {
      const template = {
        id: 'template-1',
        editionId: 'edition-1',
        primaryColor: 'invalid',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        showVenue: true,
        showDate: true,
        showQrCode: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = ticketTemplateSchema.safeParse(template)
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const template = {
        id: 'template-1',
        editionId: 'edition-1',
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        accentColor: '#10B981',
        logoUrl: 'https://example.com/logo.png',
        customFooterText: 'Custom footer',
        showVenue: true,
        showDate: true,
        showQrCode: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = ticketTemplateSchema.safeParse(template)
      expect(result.success).toBe(true)
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#3B82F6')).toEqual({ r: 59, g: 130, b: 246 })
    })

    it('should handle lowercase hex', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should handle invalid hex', () => {
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('isValidHexColor', () => {
    it('should return true for valid hex colors', () => {
      expect(isValidHexColor('#FFFFFF')).toBe(true)
      expect(isValidHexColor('#000000')).toBe(true)
      expect(isValidHexColor('#3B82F6')).toBe(true)
      expect(isValidHexColor('#abc123')).toBe(true)
    })

    it('should return false for invalid hex colors', () => {
      expect(isValidHexColor('FFFFFF')).toBe(false)
      expect(isValidHexColor('#FFF')).toBe(false)
      expect(isValidHexColor('#GGGGGG')).toBe(false)
      expect(isValidHexColor('red')).toBe(false)
    })
  })

  describe('getContrastColor', () => {
    it('should return dark color for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#1F2937')
      expect(getContrastColor('#F3F4F6')).toBe('#1F2937')
    })

    it('should return light color for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#FFFFFF')
      expect(getContrastColor('#1F2937')).toBe('#FFFFFF')
    })
  })

  describe('DEFAULT_TICKET_TEMPLATE', () => {
    it('should have default values', () => {
      expect(DEFAULT_TICKET_TEMPLATE.primaryColor).toBe('#3B82F6')
      expect(DEFAULT_TICKET_TEMPLATE.backgroundColor).toBe('#FFFFFF')
      expect(DEFAULT_TICKET_TEMPLATE.textColor).toBe('#1F2937')
      expect(DEFAULT_TICKET_TEMPLATE.accentColor).toBe('#10B981')
      expect(DEFAULT_TICKET_TEMPLATE.showVenue).toBe(true)
      expect(DEFAULT_TICKET_TEMPLATE.showDate).toBe(true)
      expect(DEFAULT_TICKET_TEMPLATE.showQrCode).toBe(true)
    })
  })
})
