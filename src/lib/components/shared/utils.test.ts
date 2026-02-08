import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  getStatusClasses,
  getStatusColor,
  truncate
} from './utils'

describe('formatDate', () => {
  it('should format a Date object', () => {
    const date = new Date('2024-06-15T10:00:00Z')
    const result = formatDate(date)
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('should format a date string', () => {
    const result = formatDate('2024-06-15')
    expect(result).toContain('2024')
  })

  it('should return empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('should return empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('should return empty string for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('')
  })

  it('should accept custom options', () => {
    const date = new Date('2024-06-15')
    const result = formatDate(date, { month: 'long' })
    // Check that it contains the month (locale-independent)
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('should format date with time', () => {
    const date = new Date('2024-06-15T14:30:00')
    const result = formatDateTime(date)
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('should return empty string for null', () => {
    expect(formatDateTime(null)).toBe('')
  })
})

describe('formatRelativeTime', () => {
  it('should return "just now" for very recent dates', () => {
    const date = new Date()
    expect(formatRelativeTime(date)).toBe('just now')
  })

  it('should return minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('5m ago')
  })

  it('should return hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('3h ago')
  })

  it('should return days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(date)).toBe('2d ago')
  })

  it('should return formatted date for older dates', () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(date)
    expect(result).not.toContain('ago')
  })

  it('should return empty string for null', () => {
    expect(formatRelativeTime(null)).toBe('')
  })

  it('should return empty string for invalid date', () => {
    expect(formatRelativeTime('invalid')).toBe('')
  })
})

describe('getStatusColor', () => {
  it('should return green for accepted', () => {
    expect(getStatusColor('accepted')).toBe('green')
  })

  it('should return red for rejected', () => {
    expect(getStatusColor('rejected')).toBe('red')
  })

  it('should return yellow for pending', () => {
    expect(getStatusColor('pending')).toBe('yellow')
  })

  it('should return blue for submitted', () => {
    expect(getStatusColor('submitted')).toBe('blue')
  })

  it('should return gray for draft', () => {
    expect(getStatusColor('draft')).toBe('gray')
  })

  it('should return gray for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('gray')
  })

  it('should handle status with dashes', () => {
    expect(getStatusColor('under-review')).toBe('purple')
  })

  it('should handle status with spaces', () => {
    expect(getStatusColor('under review')).toBe('purple')
  })

  it('should be case insensitive', () => {
    expect(getStatusColor('ACCEPTED')).toBe('green')
    expect(getStatusColor('Pending')).toBe('yellow')
  })
})

describe('getStatusClasses', () => {
  it('should return bg, text, and border classes', () => {
    const classes = getStatusClasses('accepted')
    expect(classes).toHaveProperty('bg')
    expect(classes).toHaveProperty('text')
    expect(classes).toHaveProperty('border')
  })

  it('should return green classes for accepted', () => {
    const classes = getStatusClasses('accepted')
    expect(classes.bg).toContain('green')
    expect(classes.text).toContain('green')
  })

  it('should return gray classes for unknown status', () => {
    const classes = getStatusClasses('unknown')
    expect(classes.bg).toContain('gray')
  })
})

describe('formatCurrency', () => {
  it('should format EUR by default', () => {
    const result = formatCurrency(100)
    expect(result).toContain('100')
    expect(result).toMatch(/€|EUR/)
  })

  it('should format USD', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toMatch(/\$|USD/)
  })

  it('should handle cents option', () => {
    const result = formatCurrency(10000, 'EUR', { cents: true })
    expect(result).toContain('100')
  })

  it('should format decimal values', () => {
    const result = formatCurrency(99.99)
    expect(result).toContain('99')
  })
})

describe('formatNumber', () => {
  it('should format small numbers', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('should format large numbers with separators', () => {
    const result = formatNumber(1234567)
    expect(result).toMatch(/1[,.\s]?234[,.\s]?567/)
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('should handle negative numbers', () => {
    const result = formatNumber(-1000)
    expect(result).toContain('1')
    expect(result).toContain('-')
  })
})

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('should truncate long text with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('')
  })
})
