import { describe, expect, it } from 'vitest'
import {
  buildContactComparison,
  calculateDuplicateConfidence,
  calculateNameSimilarity,
  calculateStringSimilarity,
  CONFIDENCE_THRESHOLDS,
  getConfidenceLevel,
  isPotentialDuplicate,
  levenshteinDistance,
  mergeArrays,
  normalizeString,
  suggestFieldSource
} from './contact-deduplication'

describe('contact-deduplication', () => {
  describe('normalizeString', () => {
    it('should lowercase the string', () => {
      expect(normalizeString('HELLO')).toBe('hello')
    })

    it('should remove diacritics', () => {
      expect(normalizeString('éàüöñ')).toBe('eauon')
    })

    it('should trim whitespace', () => {
      expect(normalizeString('  hello  ')).toBe('hello')
    })

    it('should handle combined transformations', () => {
      expect(normalizeString('  HÉLLO Wörld  ')).toBe('hello world')
    })
  })

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0)
    })

    it('should return length for empty comparison', () => {
      expect(levenshteinDistance('hello', '')).toBe(5)
      expect(levenshteinDistance('', 'world')).toBe(5)
    })

    it('should calculate correct distance for substitutions', () => {
      expect(levenshteinDistance('cat', 'bat')).toBe(1)
    })

    it('should calculate correct distance for insertions', () => {
      expect(levenshteinDistance('cat', 'cats')).toBe(1)
    })

    it('should calculate correct distance for deletions', () => {
      expect(levenshteinDistance('cats', 'cat')).toBe(1)
    })

    it('should calculate correct distance for complex changes', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
    })
  })

  describe('calculateStringSimilarity', () => {
    it('should return 100 for identical strings', () => {
      expect(calculateStringSimilarity('hello', 'hello')).toBe(100)
    })

    it('should return 100 for same strings with different case', () => {
      expect(calculateStringSimilarity('Hello', 'HELLO')).toBe(100)
    })

    it('should return 100 for same strings with diacritics', () => {
      expect(calculateStringSimilarity('cafe', 'café')).toBe(100)
    })

    it('should return 0 for empty strings', () => {
      expect(calculateStringSimilarity('hello', '')).toBe(0)
      expect(calculateStringSimilarity('', 'hello')).toBe(0)
    })

    it('should return high similarity for similar strings', () => {
      const similarity = calculateStringSimilarity('Martin', 'Martine')
      expect(similarity).toBeGreaterThan(80)
    })

    it('should return low similarity for different strings', () => {
      const similarity = calculateStringSimilarity('John', 'Sarah')
      expect(similarity).toBeLessThan(50)
    })
  })

  describe('calculateNameSimilarity', () => {
    it('should return 100 for identical names', () => {
      expect(calculateNameSimilarity('John', 'Doe', 'John', 'Doe')).toBe(100)
    })

    it('should weight last name more heavily', () => {
      const sameFirstDiffLast = calculateNameSimilarity('John', 'Smith', 'John', 'Jones')
      const diffFirstSameLast = calculateNameSimilarity('John', 'Smith', 'Jane', 'Smith')

      // Same last name should score higher
      expect(diffFirstSameLast).toBeGreaterThan(sameFirstDiffLast)
    })

    it('should handle similar names', () => {
      const similarity = calculateNameSimilarity('John', 'Doe', 'Jon', 'Doe')
      expect(similarity).toBeGreaterThan(80)
    })

    it('should handle completely different names', () => {
      const similarity = calculateNameSimilarity('John', 'Doe', 'Alice', 'Smith')
      expect(similarity).toBeLessThan(50)
    })
  })

  describe('calculateDuplicateConfidence', () => {
    it('should return 100 for exact email match', () => {
      const result = calculateDuplicateConfidence(
        'john@example.com',
        'john@example.com',
        'John',
        'Doe',
        'Jane',
        'Smith'
      )
      expect(result.score).toBe(100)
      expect(result.matchType).toBe('exact_email')
    })

    it('should be case insensitive for email', () => {
      const result = calculateDuplicateConfidence(
        'John@Example.COM',
        'john@example.com',
        'John',
        'Doe',
        'Jane',
        'Smith'
      )
      expect(result.score).toBe(100)
      expect(result.matchType).toBe('exact_email')
    })

    it('should detect similar names with different emails', () => {
      const result = calculateDuplicateConfidence(
        'john.doe@company1.com',
        'johndoe@company2.com',
        'John',
        'Doe',
        'John',
        'Doe'
      )
      expect(result.score).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.high)
      expect(result.matchType).toBe('similar_name')
    })

    it('should detect combined similarity', () => {
      const result = calculateDuplicateConfidence(
        'jdoe@company1.com',
        'jdoe@company2.com',
        'John',
        'Doe',
        'Jon',
        'Doe'
      )
      expect(result.score).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLDS.medium)
    })

    it('should return low score for different contacts', () => {
      const result = calculateDuplicateConfidence(
        'john@example.com',
        'alice@different.com',
        'John',
        'Doe',
        'Alice',
        'Smith'
      )
      expect(result.score).toBeLessThan(CONFIDENCE_THRESHOLDS.medium)
    })
  })

  describe('isPotentialDuplicate', () => {
    it('should return true for exact email match', () => {
      const result = isPotentialDuplicate(
        'john@example.com',
        'john@example.com',
        'John',
        'Doe',
        'Jane',
        'Smith'
      )
      expect(result).toBe(true)
    })

    it('should return true for similar names', () => {
      const result = isPotentialDuplicate(
        'john@company1.com',
        'john@company2.com',
        'John',
        'Doe',
        'John',
        'Doe'
      )
      expect(result).toBe(true)
    })

    it('should return false for different contacts', () => {
      const result = isPotentialDuplicate(
        'john@example.com',
        'alice@different.com',
        'John',
        'Doe',
        'Alice',
        'Smith'
      )
      expect(result).toBe(false)
    })

    it('should respect custom threshold', () => {
      const resultDefault = isPotentialDuplicate(
        'john@company1.com',
        'john@company2.com',
        'John',
        'Smith',
        'Jon',
        'Smyth'
      )

      const resultLowThreshold = isPotentialDuplicate(
        'john@company1.com',
        'john@company2.com',
        'John',
        'Smith',
        'Jon',
        'Smyth',
        30
      )

      expect(resultLowThreshold).toBe(true)
    })
  })

  describe('getConfidenceLevel', () => {
    it('should return certain for 100', () => {
      expect(getConfidenceLevel(100)).toBe('certain')
    })

    it('should return high for 85-99', () => {
      expect(getConfidenceLevel(90)).toBe('high')
      expect(getConfidenceLevel(85)).toBe('high')
    })

    it('should return medium for 70-84', () => {
      expect(getConfidenceLevel(75)).toBe('medium')
      expect(getConfidenceLevel(70)).toBe('medium')
    })

    it('should return low for below 70', () => {
      expect(getConfidenceLevel(60)).toBe('low')
      expect(getConfidenceLevel(0)).toBe('low')
    })
  })

  describe('suggestFieldSource', () => {
    it('should suggest contact1 when only value1 exists', () => {
      expect(suggestFieldSource('value', null)).toBe('contact1')
      expect(suggestFieldSource('value', '')).toBe('contact1')
      expect(suggestFieldSource('value', undefined)).toBe('contact1')
    })

    it('should suggest contact2 when only value2 exists', () => {
      expect(suggestFieldSource(null, 'value')).toBe('contact2')
      expect(suggestFieldSource('', 'value')).toBe('contact2')
      expect(suggestFieldSource(undefined, 'value')).toBe('contact2')
    })

    it('should suggest contact1 when both are empty', () => {
      expect(suggestFieldSource(null, null)).toBe('contact1')
      expect(suggestFieldSource('', '')).toBe('contact1')
    })

    it('should prefer longer value when both exist', () => {
      expect(suggestFieldSource('short', 'longer value')).toBe('contact2')
      expect(suggestFieldSource('longer value', 'short')).toBe('contact1')
    })

    it('should default to contact1 for equal values', () => {
      expect(suggestFieldSource('same', 'same')).toBe('contact1')
    })
  })

  describe('mergeArrays', () => {
    it('should merge and dedupe arrays', () => {
      const result = mergeArrays(['a', 'b', 'c'], ['b', 'c', 'd'])
      expect(result).toEqual(['a', 'b', 'c', 'd'])
    })

    it('should handle empty arrays', () => {
      expect(mergeArrays([], ['a', 'b'])).toEqual(['a', 'b'])
      expect(mergeArrays(['a', 'b'], [])).toEqual(['a', 'b'])
      expect(mergeArrays([], [])).toEqual([])
    })

    it('should work with numbers', () => {
      const result = mergeArrays([1, 2, 3], [2, 3, 4])
      expect(result).toEqual([1, 2, 3, 4])
    })
  })

  describe('buildContactComparison', () => {
    const contact1 = {
      id: 'c1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'ACME Inc',
      phone: ''
    }

    const contact2 = {
      id: 'c2',
      email: 'john.doe@example.com',
      firstName: 'Jon',
      lastName: 'Doe',
      company: '',
      phone: '+1234567890'
    }

    it('should build comparison for specified fields', () => {
      const result = buildContactComparison(contact1, contact2, [
        'email',
        'firstName',
        'lastName',
        'company',
        'phone'
      ])

      expect(result.contactId1).toBe('c1')
      expect(result.contactId2).toBe('c2')
      expect(result.fields).toHaveLength(5)
    })

    it('should calculate similarity for each field', () => {
      const result = buildContactComparison(contact1, contact2, ['firstName', 'lastName'])

      const firstNameField = result.fields.find((f) => f.fieldName === 'firstName')
      const lastNameField = result.fields.find((f) => f.fieldName === 'lastName')

      expect(firstNameField?.similarity).toBeGreaterThan(70)
      expect(lastNameField?.similarity).toBe(100)
    })

    it('should suggest source for each field', () => {
      const result = buildContactComparison(contact1, contact2, ['company', 'phone'])

      const companyField = result.fields.find((f) => f.fieldName === 'company')
      const phoneField = result.fields.find((f) => f.fieldName === 'phone')

      expect(companyField?.suggestedSource).toBe('contact1') // has value
      expect(phoneField?.suggestedSource).toBe('contact2') // has value
    })

    it('should include values in comparison', () => {
      const result = buildContactComparison(contact1, contact2, ['email'])

      const emailField = result.fields.find((f) => f.fieldName === 'email')
      expect(emailField?.value1).toBe('john@example.com')
      expect(emailField?.value2).toBe('john.doe@example.com')
    })
  })
})
