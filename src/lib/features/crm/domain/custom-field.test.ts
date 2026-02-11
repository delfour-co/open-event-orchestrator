import { describe, expect, it } from 'vitest'
import {
  type CustomField,
  buildTemplateVariable,
  formatFieldValue,
  generateFieldKey,
  parseFieldValue,
  validateFieldValue
} from './custom-field'

const createMockField = (overrides: Partial<CustomField> = {}): CustomField => ({
  id: 'field-1',
  eventId: 'evt-1',
  name: 'Test Field',
  key: 'test_field',
  fieldType: 'text',
  isRequired: false,
  isActive: true,
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Custom Field Domain', () => {
  describe('generateFieldKey', () => {
    it('should generate valid key from name', () => {
      expect(generateFieldKey('Company Name')).toBe('company_name')
    })

    it('should handle special characters', () => {
      expect(generateFieldKey("User's Email")).toBe('user_s_email')
    })

    it('should handle numbers at start', () => {
      expect(generateFieldKey('1st Place')).toBe('f1st_place')
    })

    it('should trim underscores', () => {
      expect(generateFieldKey('  Test  ')).toBe('test')
    })

    it('should limit length', () => {
      const longName = 'This is a very long field name that exceeds the maximum allowed length'
      expect(generateFieldKey(longName).length).toBeLessThanOrEqual(50)
    })
  })

  describe('validateFieldValue', () => {
    it('should pass for optional empty value', () => {
      const field = createMockField({ isRequired: false })
      expect(validateFieldValue(field, undefined)).toEqual({ valid: true })
    })

    it('should fail for required empty value', () => {
      const field = createMockField({ isRequired: true })
      const result = validateFieldValue(field, undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should validate number type', () => {
      const field = createMockField({
        fieldType: 'number',
        options: { min: 0, max: 100 }
      })

      expect(validateFieldValue(field, '50')).toEqual({ valid: true })
      expect(validateFieldValue(field, '-10').valid).toBe(false)
      expect(validateFieldValue(field, '150').valid).toBe(false)
      expect(validateFieldValue(field, 'abc').valid).toBe(false)
    })

    it('should validate date type', () => {
      const field = createMockField({ fieldType: 'date' })

      expect(validateFieldValue(field, '2024-01-15')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'not-a-date').valid).toBe(false)
    })

    it('should validate select type', () => {
      const field = createMockField({
        fieldType: 'select',
        options: { choices: ['option1', 'option2', 'option3'] }
      })

      expect(validateFieldValue(field, 'option1')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'invalid').valid).toBe(false)
    })

    it('should validate checkbox type', () => {
      const field = createMockField({ fieldType: 'checkbox' })

      expect(validateFieldValue(field, 'true')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'false')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'maybe').valid).toBe(false)
    })

    it('should validate url type', () => {
      const field = createMockField({ fieldType: 'url' })

      expect(validateFieldValue(field, 'https://example.com')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'not-a-url').valid).toBe(false)
    })

    it('should validate text length constraints', () => {
      const field = createMockField({
        fieldType: 'text',
        options: { minLength: 5, maxLength: 10 }
      })

      expect(validateFieldValue(field, 'hello')).toEqual({ valid: true })
      expect(validateFieldValue(field, 'hi').valid).toBe(false)
      expect(validateFieldValue(field, 'this is too long').valid).toBe(false)
    })
  })

  describe('formatFieldValue', () => {
    it('should format checkbox value', () => {
      const field = createMockField({ fieldType: 'checkbox' })
      expect(formatFieldValue(field, 'true')).toBe('Yes')
      expect(formatFieldValue(field, 'false')).toBe('No')
    })

    it('should format date value', () => {
      const field = createMockField({ fieldType: 'date' })
      const result = formatFieldValue(field, '2024-01-15')
      expect(result).toBeTruthy()
    })

    it('should format number value', () => {
      const field = createMockField({ fieldType: 'number' })
      expect(formatFieldValue(field, '1234567')).toMatch(/1.*234.*567/)
    })

    it('should return empty string for undefined', () => {
      const field = createMockField()
      expect(formatFieldValue(field, undefined)).toBe('')
    })
  })

  describe('parseFieldValue', () => {
    it('should parse checkbox value', () => {
      const field = createMockField({ fieldType: 'checkbox' })
      expect(parseFieldValue(field, true)).toBe('true')
      expect(parseFieldValue(field, false)).toBe('false')
    })

    it('should parse date value', () => {
      const field = createMockField({ fieldType: 'date' })
      const date = new Date('2024-01-15')
      expect(parseFieldValue(field, date)).toBe(date.toISOString())
    })

    it('should parse string values', () => {
      const field = createMockField({ fieldType: 'text' })
      expect(parseFieldValue(field, 'hello')).toBe('hello')
    })

    it('should return empty string for null', () => {
      const field = createMockField()
      expect(parseFieldValue(field, null)).toBe('')
    })
  })

  describe('buildTemplateVariable', () => {
    it('should build correct variable name', () => {
      const field = createMockField({ key: 'company_name' })
      expect(buildTemplateVariable(field)).toBe('{{custom.company_name}}')
    })
  })
})
