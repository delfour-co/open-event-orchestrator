import { describe, expect, it } from 'vitest'
import {
  escapeFilterValue,
  filterAnd,
  filterContains,
  filterEquals,
  filterIn,
  filterOr,
  safeFilter
} from './safe-filter'

describe('escapeFilterValue', () => {
  it('should return unchanged string for safe input', () => {
    expect(escapeFilterValue('hello')).toBe('hello')
    expect(escapeFilterValue('test123')).toBe('test123')
  })

  it('should escape double quotes', () => {
    expect(escapeFilterValue('test"injection')).toBe('test\\"injection')
    expect(escapeFilterValue('"quoted"')).toBe('\\"quoted\\"')
  })

  it('should escape backslashes', () => {
    expect(escapeFilterValue('path\\to\\file')).toBe('path\\\\to\\\\file')
  })

  it('should escape control characters', () => {
    expect(escapeFilterValue('line1\nline2')).toBe('line1\\nline2')
    expect(escapeFilterValue('tab\there')).toBe('tab\\there')
    expect(escapeFilterValue('return\rhere')).toBe('return\\rhere')
  })

  it('should handle combined special characters', () => {
    expect(escapeFilterValue('test"\\\n')).toBe('test\\"\\\\\\n')
  })

  it('should handle empty string', () => {
    expect(escapeFilterValue('')).toBe('')
  })

  it('should convert non-strings to strings', () => {
    expect(escapeFilterValue(123 as unknown as string)).toBe('123')
  })
})

describe('safeFilter', () => {
  it('should build simple equality filter', () => {
    const slug = 'test-event'
    expect(safeFilter`slug = ${slug}`).toBe('slug = "test-event"')
  })

  it('should escape injection attempts', () => {
    const malicious = 'test" || 1=1 || "'
    expect(safeFilter`slug = ${malicious}`).toBe('slug = "test\\" || 1=1 || \\""')
  })

  it('should handle multiple values', () => {
    const editionId = 'abc123'
    const status = 'active'
    expect(safeFilter`editionId = ${editionId} && status = ${status}`).toBe(
      'editionId = "abc123" && status = "active"'
    )
  })

  it('should handle null values', () => {
    expect(safeFilter`field = ${null}`).toBe('field = null')
  })

  it('should handle undefined values', () => {
    expect(safeFilter`field = ${undefined}`).toBe('field = null')
  })

  it('should handle boolean values without quotes', () => {
    expect(safeFilter`isActive = ${true}`).toBe('isActive = true')
    expect(safeFilter`isActive = ${false}`).toBe('isActive = false')
  })

  it('should handle number values without quotes', () => {
    expect(safeFilter`amount > ${100}`).toBe('amount > 100')
    expect(safeFilter`price = ${99.99}`).toBe('price = 99.99')
  })

  it('should handle mixed value types', () => {
    const id = 'abc123'
    const count = 5
    const active = true
    expect(safeFilter`id = ${id} && count >= ${count} && active = ${active}`).toBe(
      'id = "abc123" && count >= 5 && active = true'
    )
  })
})

describe('filterEquals', () => {
  it('should build equality condition', () => {
    expect(filterEquals('slug', 'test-event')).toBe('slug = "test-event"')
  })

  it('should escape dangerous values', () => {
    expect(filterEquals('name', 'test"evil')).toBe('name = "test\\"evil"')
  })
})

describe('filterContains', () => {
  it('should build contains condition for relations', () => {
    expect(filterContains('speakerIds', 'speaker123')).toBe('speakerIds ~ "speaker123"')
  })

  it('should escape dangerous values', () => {
    expect(filterContains('tags', 'tag"evil')).toBe('tags ~ "tag\\"evil"')
  })
})

describe('filterIn', () => {
  it('should build IN condition with multiple values', () => {
    expect(filterIn('status', ['draft', 'submitted'])).toBe(
      '(status = "draft" || status = "submitted")'
    )
  })

  it('should handle single value', () => {
    expect(filterIn('status', ['active'])).toBe('(status = "active")')
  })

  it('should return false for empty array', () => {
    expect(filterIn('status', [])).toBe('false')
  })

  it('should escape dangerous values', () => {
    expect(filterIn('status', ['test"evil'])).toBe('(status = "test\\"evil")')
  })
})

describe('filterAnd', () => {
  it('should combine conditions with AND', () => {
    expect(filterAnd('a = 1', 'b = 2')).toBe('a = 1 && b = 2')
  })

  it('should handle single condition', () => {
    expect(filterAnd('a = 1')).toBe('a = 1')
  })

  it('should filter out null and undefined', () => {
    expect(filterAnd('a = 1', null, 'b = 2', undefined)).toBe('a = 1 && b = 2')
  })

  it('should filter out empty strings', () => {
    expect(filterAnd('a = 1', '', 'b = 2', '  ')).toBe('a = 1 && b = 2')
  })

  it('should return empty string for no valid conditions', () => {
    expect(filterAnd()).toBe('')
    expect(filterAnd(null, undefined, '')).toBe('')
  })
})

describe('filterOr', () => {
  it('should combine conditions with OR and wrap in parentheses', () => {
    expect(filterOr('a = 1', 'b = 2')).toBe('(a = 1 || b = 2)')
  })

  it('should handle single condition without parentheses', () => {
    expect(filterOr('a = 1')).toBe('a = 1')
  })

  it('should filter out null and undefined', () => {
    expect(filterOr('a = 1', null, 'b = 2', undefined)).toBe('(a = 1 || b = 2)')
  })

  it('should return empty string for no valid conditions', () => {
    expect(filterOr()).toBe('')
  })
})

describe('real-world injection scenarios', () => {
  it('should prevent classic SQL-style injection', () => {
    const userInput = '" || id != "" || "'
    const filter = safeFilter`email = ${userInput}`
    // The filter should be safely escaped, not executable as injection
    expect(filter).toBe('email = "\\" || id != \\"\\" || \\""')
    expect(filter).not.toContain('|| id != ""')
  })

  it('should prevent filter breakout with newlines', () => {
    const userInput = 'test\n" || secret = "'
    const filter = safeFilter`name = ${userInput}`
    expect(filter).toBe('name = "test\\n\\" || secret = \\""')
  })

  it('should handle unicode characters safely', () => {
    const userInput = 'Test émoji 🎉 and "quotes"'
    const filter = safeFilter`name = ${userInput}`
    expect(filter).toBe('name = "Test émoji 🎉 and \\"quotes\\""')
  })
})
