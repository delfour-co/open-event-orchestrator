import { describe, expect, it } from 'vitest'
import {
  buildVariableInsert,
  extractUsedVariables,
  generateCloneName,
  getVariableCategories,
  getVariablesByCategory,
  interpolateWithExamples,
  type LibraryTemplate,
  matchesSearchCriteria,
  sortTemplates,
  LIBRARY_TEMPLATE_VARIABLES,
  validateTemplateVariables
} from './template-library'

describe('template-library', () => {
  const now = new Date()

  const createTemplate = (overrides: Partial<LibraryTemplate> = {}): LibraryTemplate => ({
    id: 't1',
    name: 'Test Template',
    category: 'invitation',
    subject: 'Test Subject',
    htmlContent: '<p>Hello {{contact.firstName}}</p>',
    tags: ['event', 'marketing'],
    isGlobal: false,
    isFavorite: false,
    isPinned: false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('getVariablesByCategory', () => {
    it('should return contact variables', () => {
      const contactVars = getVariablesByCategory('contact')
      expect(contactVars.length).toBeGreaterThan(0)
      expect(contactVars.every((v) => v.category === 'contact')).toBe(true)
    })

    it('should return event variables', () => {
      const eventVars = getVariablesByCategory('event')
      expect(eventVars.length).toBeGreaterThan(0)
      expect(eventVars.every((v) => v.category === 'event')).toBe(true)
    })

    it('should return edition variables', () => {
      const editionVars = getVariablesByCategory('edition')
      expect(editionVars.length).toBeGreaterThan(0)
      expect(editionVars.some((v) => v.key === 'edition.startDate')).toBe(true)
    })
  })

  describe('getVariableCategories', () => {
    it('should return all unique categories', () => {
      const categories = getVariableCategories()
      expect(categories).toContain('contact')
      expect(categories).toContain('event')
      expect(categories).toContain('edition')
      expect(categories).toContain('ticket')
      expect(categories).toContain('speaker')
      expect(categories).toContain('custom')
    })
  })

  describe('extractUsedVariables', () => {
    it('should extract variables from content', () => {
      const content = 'Hello {{contact.firstName}} {{contact.lastName}}'
      const vars = extractUsedVariables(content)

      expect(vars).toContain('contact.firstName')
      expect(vars).toContain('contact.lastName')
    })

    it('should return unique variables', () => {
      const content = '{{contact.firstName}} and {{contact.firstName}} again'
      const vars = extractUsedVariables(content)

      expect(vars).toHaveLength(1)
      expect(vars[0]).toBe('contact.firstName')
    })

    it('should handle whitespace in variables', () => {
      const content = '{{ contact.firstName }} and {{contact.lastName}}'
      const vars = extractUsedVariables(content)

      expect(vars).toContain('contact.firstName')
      expect(vars).toContain('contact.lastName')
    })

    it('should return empty array for no variables', () => {
      const content = 'No variables here'
      const vars = extractUsedVariables(content)

      expect(vars).toHaveLength(0)
    })
  })

  describe('validateTemplateVariables', () => {
    it('should validate known variables', () => {
      const content = '{{contact.firstName}} {{event.name}}'
      const result = validateTemplateVariables(content)

      expect(result.valid).toBe(true)
      expect(result.invalidVariables).toHaveLength(0)
    })

    it('should detect invalid variables', () => {
      const content = '{{contact.firstName}} {{invalid.variable}}'
      const result = validateTemplateVariables(content)

      expect(result.valid).toBe(false)
      expect(result.invalidVariables).toContain('invalid.variable')
    })

    it('should allow custom field variables', () => {
      const content = '{{custom.myField}}'
      const result = validateTemplateVariables(content)

      expect(result.valid).toBe(true)
    })
  })

  describe('interpolateWithExamples', () => {
    it('should replace variables with examples', () => {
      const content = 'Hello {{contact.firstName}} {{contact.lastName}}'
      const result = interpolateWithExamples(content)

      expect(result).toBe('Hello John Doe')
    })

    it('should handle multiple occurrences', () => {
      const content = '{{contact.firstName}} is {{contact.firstName}}'
      const result = interpolateWithExamples(content)

      expect(result).toBe('John is John')
    })

    it('should leave unknown variables unchanged', () => {
      const content = '{{unknown.variable}}'
      const result = interpolateWithExamples(content)

      expect(result).toBe('{{unknown.variable}}')
    })
  })

  describe('buildVariableInsert', () => {
    it('should build variable insertion string', () => {
      const variable = LIBRARY_TEMPLATE_VARIABLES.find((v) => v.key === 'contact.firstName')!
      const result = buildVariableInsert(variable)

      expect(result).toBe('{{contact.firstName}}')
    })
  })

  describe('generateCloneName', () => {
    it('should add (copy) suffix', () => {
      expect(generateCloneName('My Template')).toBe('My Template (copy)')
    })

    it('should increment copy number', () => {
      expect(generateCloneName('My Template (copy)')).toBe('My Template (copy 2)')
    })

    it('should increment existing number', () => {
      expect(generateCloneName('My Template (copy 2)')).toBe('My Template (copy 3)')
      expect(generateCloneName('My Template (copy 10)')).toBe('My Template (copy 11)')
    })
  })

  describe('matchesSearchCriteria', () => {
    it('should match by query in name', () => {
      const template = createTemplate({ name: 'Welcome Email' })

      expect(matchesSearchCriteria(template, { query: 'welcome' })).toBe(true)
      expect(matchesSearchCriteria(template, { query: 'goodbye' })).toBe(false)
    })

    it('should match by query in description', () => {
      const template = createTemplate({ description: 'Send to new subscribers' })

      expect(matchesSearchCriteria(template, { query: 'subscriber' })).toBe(true)
    })

    it('should match by query in tags', () => {
      const template = createTemplate({ tags: ['marketing', 'newsletter'] })

      expect(matchesSearchCriteria(template, { query: 'marketing' })).toBe(true)
    })

    it('should filter by category', () => {
      const template = createTemplate({ category: 'invitation' })

      expect(matchesSearchCriteria(template, { category: 'invitation' })).toBe(true)
      expect(matchesSearchCriteria(template, { category: 'confirmation' })).toBe(false)
    })

    it('should filter by isGlobal', () => {
      const globalTemplate = createTemplate({ isGlobal: true })
      const localTemplate = createTemplate({ isGlobal: false })

      expect(matchesSearchCriteria(globalTemplate, { isGlobal: true })).toBe(true)
      expect(matchesSearchCriteria(localTemplate, { isGlobal: true })).toBe(false)
    })

    it('should filter by isFavorite', () => {
      const favorite = createTemplate({ isFavorite: true })
      const notFavorite = createTemplate({ isFavorite: false })

      expect(matchesSearchCriteria(favorite, { isFavorite: true })).toBe(true)
      expect(matchesSearchCriteria(notFavorite, { isFavorite: true })).toBe(false)
    })

    it('should filter by tags', () => {
      const template = createTemplate({ tags: ['marketing', 'newsletter', 'event'] })

      expect(matchesSearchCriteria(template, { tags: ['marketing'] })).toBe(true)
      expect(matchesSearchCriteria(template, { tags: ['marketing', 'newsletter'] })).toBe(true)
      expect(matchesSearchCriteria(template, { tags: ['other'] })).toBe(false)
    })

    it('should combine multiple criteria', () => {
      const template = createTemplate({
        name: 'Welcome',
        category: 'invitation',
        isFavorite: true
      })

      expect(
        matchesSearchCriteria(template, {
          query: 'welcome',
          category: 'invitation',
          isFavorite: true
        })
      ).toBe(true)

      expect(
        matchesSearchCriteria(template, {
          query: 'welcome',
          category: 'confirmation'
        })
      ).toBe(false)
    })
  })

  describe('sortTemplates', () => {
    it('should sort pinned templates first', () => {
      const templates = [
        createTemplate({ id: 't1', isPinned: false }),
        createTemplate({ id: 't2', isPinned: true }),
        createTemplate({ id: 't3', isPinned: false })
      ]

      const sorted = sortTemplates(templates)

      expect(sorted[0].id).toBe('t2')
    })

    it('should sort favorites after pinned', () => {
      const templates = [
        createTemplate({ id: 't1', isPinned: false, isFavorite: false }),
        createTemplate({ id: 't2', isPinned: false, isFavorite: true }),
        createTemplate({ id: 't3', isPinned: true, isFavorite: false })
      ]

      const sorted = sortTemplates(templates)

      expect(sorted[0].id).toBe('t3') // pinned
      expect(sorted[1].id).toBe('t2') // favorite
    })

    it('should sort by usage count within same priority', () => {
      const templates = [
        createTemplate({ id: 't1', usageCount: 5 }),
        createTemplate({ id: 't2', usageCount: 10 }),
        createTemplate({ id: 't3', usageCount: 1 })
      ]

      const sorted = sortTemplates(templates)

      expect(sorted[0].id).toBe('t2')
      expect(sorted[1].id).toBe('t1')
      expect(sorted[2].id).toBe('t3')
    })

    it('should not mutate original array', () => {
      const templates = [
        createTemplate({ id: 't1', usageCount: 5 }),
        createTemplate({ id: 't2', usageCount: 10 })
      ]

      const sorted = sortTemplates(templates)

      expect(templates[0].id).toBe('t1')
      expect(sorted[0].id).toBe('t2')
    })
  })

  describe('LIBRARY_TEMPLATE_VARIABLES', () => {
    it('should have all required fields', () => {
      for (const variable of LIBRARY_TEMPLATE_VARIABLES) {
        expect(variable.key).toBeDefined()
        expect(variable.name).toBeDefined()
        expect(variable.description).toBeDefined()
        expect(variable.example).toBeDefined()
        expect(variable.category).toBeDefined()
      }
    })

    it('should have unique keys', () => {
      const keys = LIBRARY_TEMPLATE_VARIABLES.map((v) => v.key)
      const uniqueKeys = [...new Set(keys)]
      expect(keys.length).toBe(uniqueKeys.length)
    })
  })
})
