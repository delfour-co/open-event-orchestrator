import { describe, expect, it } from 'vitest'
import {
  type ReportConfig,
  calculateNextScheduledAt,
  getScheduleDescription,
  isValidSchedule,
  reportConfigSchema,
  validateRecipients
} from './report-config'

describe('reportConfigSchema', () => {
  const validConfig = {
    id: 'cfg-123',
    editionId: 'ed-456',
    name: 'Weekly Report',
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 'monday',
    timeOfDay: '09:00',
    timezone: 'Europe/Paris',
    recipients: [{ email: 'test@example.com', name: 'Test User' }],
    sections: ['cfp', 'billing'],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('validates a correct configuration', () => {
    const result = reportConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const invalid = {
      ...validConfig,
      recipients: [{ email: 'invalid-email' }]
    }
    const result = reportConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects empty recipients', () => {
    const invalid = {
      ...validConfig,
      recipients: []
    }
    const result = reportConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects empty sections', () => {
    const invalid = {
      ...validConfig,
      sections: []
    }
    const result = reportConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects invalid time format', () => {
    const invalid = {
      ...validConfig,
      timeOfDay: '9:00'
    }
    const result = reportConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts valid time formats', () => {
    const times = ['00:00', '09:30', '12:00', '23:59']
    for (const timeOfDay of times) {
      const result = reportConfigSchema.safeParse({ ...validConfig, timeOfDay })
      expect(result.success, `Expected ${timeOfDay} to be valid`).toBe(true)
    }
  })
})

describe('isValidSchedule', () => {
  it('returns true for valid daily schedule', () => {
    const config = {
      frequency: 'daily',
      timeOfDay: '09:00'
    } as ReportConfig
    expect(isValidSchedule(config)).toBe(true)
  })

  it('returns true for valid weekly schedule with day', () => {
    const config = {
      frequency: 'weekly',
      dayOfWeek: 'monday',
      timeOfDay: '09:00'
    } as ReportConfig
    expect(isValidSchedule(config)).toBe(true)
  })

  it('returns false for weekly schedule without day', () => {
    const config = {
      frequency: 'weekly',
      timeOfDay: '09:00'
    } as ReportConfig
    expect(isValidSchedule(config)).toBe(false)
  })

  it('returns true for valid monthly schedule with day', () => {
    const config = {
      frequency: 'monthly',
      dayOfMonth: 15,
      timeOfDay: '09:00'
    } as ReportConfig
    expect(isValidSchedule(config)).toBe(true)
  })

  it('returns false for monthly schedule without day', () => {
    const config = {
      frequency: 'monthly',
      timeOfDay: '09:00'
    } as ReportConfig
    expect(isValidSchedule(config)).toBe(false)
  })
})

describe('calculateNextScheduledAt', () => {
  it('calculates next daily schedule', () => {
    const config = {
      frequency: 'daily' as const,
      timeOfDay: '09:00',
      timezone: 'UTC'
    }
    const fromDate = new Date('2024-01-15T08:00:00Z')
    const next = calculateNextScheduledAt(config, fromDate)

    expect(next.getUTCHours()).toBe(9)
    expect(next.getMinutes()).toBe(0)
  })

  it('calculates next daily schedule for next day when time passed', () => {
    const config = {
      frequency: 'daily' as const,
      timeOfDay: '09:00',
      timezone: 'UTC'
    }
    const fromDate = new Date('2024-01-15T10:00:00Z')
    const next = calculateNextScheduledAt(config, fromDate)

    expect(next.getUTCDate()).toBe(16)
    expect(next.getUTCHours()).toBe(9)
  })

  it('calculates next weekly schedule', () => {
    const config = {
      frequency: 'weekly' as const,
      dayOfWeek: 'friday' as const,
      timeOfDay: '14:00',
      timezone: 'UTC'
    }
    const fromDate = new Date('2024-01-15T08:00:00Z')
    const next = calculateNextScheduledAt(config, fromDate)

    expect(next.getUTCDay()).toBe(5)
    expect(next.getUTCHours()).toBe(14)
  })

  it('calculates next monthly schedule', () => {
    const config = {
      frequency: 'monthly' as const,
      dayOfMonth: 20,
      timeOfDay: '10:00',
      timezone: 'UTC'
    }
    const fromDate = new Date('2024-01-15T08:00:00Z')
    const next = calculateNextScheduledAt(config, fromDate)

    expect(next.getUTCDate()).toBe(20)
    expect(next.getUTCHours()).toBe(10)
  })

  it('moves to next month if day passed', () => {
    const config = {
      frequency: 'monthly' as const,
      dayOfMonth: 10,
      timeOfDay: '10:00',
      timezone: 'UTC'
    }
    const fromDate = new Date('2024-01-15T08:00:00Z')
    const next = calculateNextScheduledAt(config, fromDate)

    expect(next.getMonth()).toBe(1)
    expect(next.getUTCDate()).toBe(10)
  })
})

describe('getScheduleDescription', () => {
  it('describes daily schedule', () => {
    const config = {
      frequency: 'daily' as const,
      timeOfDay: '09:00'
    }
    expect(getScheduleDescription(config)).toBe('Daily at 09:00')
  })

  it('describes weekly schedule', () => {
    const config = {
      frequency: 'weekly' as const,
      dayOfWeek: 'monday' as const,
      timeOfDay: '14:30'
    }
    expect(getScheduleDescription(config)).toBe('Weekly on monday at 14:30')
  })

  it('describes monthly schedule', () => {
    const config = {
      frequency: 'monthly' as const,
      dayOfMonth: 15,
      timeOfDay: '10:00'
    }
    expect(getScheduleDescription(config)).toBe('Monthly on day 15 at 10:00')
  })
})

describe('validateRecipients', () => {
  it('returns valid for correct recipients', () => {
    const recipients = [
      { email: 'user1@example.com', name: 'User 1' },
      { email: 'user2@example.com' }
    ]
    const result = validateRecipients(recipients)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for empty recipients', () => {
    const result = validateRecipients([])
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one recipient is required')
  })

  it('returns error for duplicate emails', () => {
    const recipients = [{ email: 'user@example.com' }, { email: 'USER@example.com' }]
    const result = validateRecipients(recipients)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true)
  })
})
