import { describe, expect, it } from 'vitest'
import { TEMPLATE_VARIABLES, extractVariables, interpolateTemplate } from './email-template'

describe('EmailTemplate', () => {
  describe('interpolateTemplate', () => {
    it('should replace {{variables}} with values', () => {
      const template = 'Hello {{firstName}} {{lastName}}!'
      const variables = { '{{firstName}}': 'Alice', '{{lastName}}': 'Martin' }
      const result = interpolateTemplate(template, variables)
      expect(result).toBe('Hello Alice Martin!')
    })

    it('should handle multiple occurrences of the same variable', () => {
      const template = '{{firstName}} is great. We love {{firstName}}!'
      const variables = { '{{firstName}}': 'Alice' }
      const result = interpolateTemplate(template, variables)
      expect(result).toBe('Alice is great. We love Alice!')
    })

    it('should leave unmatched variables as-is', () => {
      const template = 'Hello {{firstName}} from {{company}}'
      const variables = { '{{firstName}}': 'Alice' }
      const result = interpolateTemplate(template, variables)
      expect(result).toBe('Hello Alice from {{company}}')
    })

    it('should return the original template if no variables provided', () => {
      const template = 'Hello {{firstName}}!'
      const result = interpolateTemplate(template, {})
      expect(result).toBe('Hello {{firstName}}!')
    })

    it('should handle template with no variables', () => {
      const template = 'Plain text with no variables.'
      const variables = { '{{firstName}}': 'Alice' }
      const result = interpolateTemplate(template, variables)
      expect(result).toBe('Plain text with no variables.')
    })
  })

  describe('extractVariables', () => {
    it('should extract unique variable names from template string', () => {
      const template = 'Hello {{firstName}} {{lastName}}, welcome to {{eventName}}'
      const result = extractVariables(template)
      expect(result).toEqual(['{{firstName}}', '{{lastName}}', '{{eventName}}'])
    })

    it('should return unique variables only', () => {
      const template = '{{firstName}} {{firstName}} {{lastName}}'
      const result = extractVariables(template)
      expect(result).toEqual(['{{firstName}}', '{{lastName}}'])
    })

    it('should return empty array for template with no variables', () => {
      const template = 'No variables here.'
      const result = extractVariables(template)
      expect(result).toEqual([])
    })

    it('should extract a single variable', () => {
      const template = 'Hi {{email}}'
      const result = extractVariables(template)
      expect(result).toEqual(['{{email}}'])
    })
  })

  describe('TEMPLATE_VARIABLES', () => {
    it('should have expected keys', () => {
      const expectedKeys = [
        '{{firstName}}',
        '{{lastName}}',
        '{{email}}',
        '{{company}}',
        '{{eventName}}',
        '{{editionName}}',
        '{{unsubscribeUrl}}'
      ]
      for (const key of expectedKeys) {
        expect(TEMPLATE_VARIABLES).toHaveProperty(key)
      }
      expect(Object.keys(TEMPLATE_VARIABLES)).toHaveLength(expectedKeys.length)
    })
  })
})
