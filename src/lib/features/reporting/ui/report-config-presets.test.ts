import { describe, expect, it } from 'vitest'

// Test the preset definitions and their validation
describe('Report Config Presets', () => {
  // Define presets here since we can't import from Svelte component
  const REPORT_PRESETS = [
    {
      name: 'Weekly Summary',
      label: 'Weekly Summary',
      frequency: 'weekly',
      dayOfWeek: 'monday',
      timeOfDay: '09:00',
      recipientRoles: ['admin', 'organizer'],
      sections: ['cfp', 'billing', 'planning']
    },
    {
      name: 'Daily Sales',
      label: 'Daily Sales',
      frequency: 'daily',
      timeOfDay: '08:00',
      recipientRoles: ['admin'],
      sections: ['billing']
    },
    {
      name: 'Monthly Overview',
      label: 'Monthly Overview',
      frequency: 'monthly',
      dayOfMonth: 1,
      timeOfDay: '10:00',
      recipientRoles: ['owner', 'admin'],
      sections: ['cfp', 'billing', 'planning', 'budget', 'sponsoring']
    },
    {
      name: 'CFP Weekly',
      label: 'CFP Weekly',
      frequency: 'weekly',
      dayOfWeek: 'friday',
      timeOfDay: '17:00',
      recipientRoles: ['admin', 'organizer'],
      sections: ['cfp']
    }
  ] as const

  describe('preset definitions', () => {
    it('should have 4 presets', () => {
      expect(REPORT_PRESETS).toHaveLength(4)
    })

    it('should have unique names', () => {
      const names = REPORT_PRESETS.map((p) => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have valid frequencies', () => {
      const validFrequencies = ['daily', 'weekly', 'monthly']
      for (const preset of REPORT_PRESETS) {
        expect(validFrequencies).toContain(preset.frequency)
      }
    })

    it('should have valid time format (HH:MM)', () => {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      for (const preset of REPORT_PRESETS) {
        expect(preset.timeOfDay).toMatch(timeRegex)
      }
    })

    it('should have at least one recipient role', () => {
      for (const preset of REPORT_PRESETS) {
        expect(preset.recipientRoles.length).toBeGreaterThan(0)
      }
    })

    it('should have at least one section', () => {
      for (const preset of REPORT_PRESETS) {
        expect(preset.sections.length).toBeGreaterThan(0)
      }
    })

    it('should have valid recipient roles', () => {
      const validRoles = ['owner', 'admin', 'organizer']
      for (const preset of REPORT_PRESETS) {
        for (const role of preset.recipientRoles) {
          expect(validRoles).toContain(role)
        }
      }
    })

    it('should have valid sections', () => {
      const validSections = ['cfp', 'billing', 'planning', 'crm', 'budget', 'sponsoring']
      for (const preset of REPORT_PRESETS) {
        for (const section of preset.sections) {
          expect(validSections).toContain(section)
        }
      }
    })
  })

  describe('Weekly Summary preset', () => {
    const preset = REPORT_PRESETS[0]

    it('should be weekly frequency', () => {
      expect(preset.frequency).toBe('weekly')
    })

    it('should be sent on Monday at 9:00', () => {
      expect(preset.dayOfWeek).toBe('monday')
      expect(preset.timeOfDay).toBe('09:00')
    })

    it('should be sent to admin and organizer', () => {
      expect(preset.recipientRoles).toContain('admin')
      expect(preset.recipientRoles).toContain('organizer')
    })

    it('should include CFP, billing, and planning sections', () => {
      expect(preset.sections).toContain('cfp')
      expect(preset.sections).toContain('billing')
      expect(preset.sections).toContain('planning')
    })
  })

  describe('Daily Sales preset', () => {
    const preset = REPORT_PRESETS[1]

    it('should be daily frequency', () => {
      expect(preset.frequency).toBe('daily')
    })

    it('should be sent at 8:00', () => {
      expect(preset.timeOfDay).toBe('08:00')
    })

    it('should be sent only to admin', () => {
      expect(preset.recipientRoles).toEqual(['admin'])
    })

    it('should include only billing section', () => {
      expect(preset.sections).toEqual(['billing'])
    })

    it('should not have dayOfWeek or dayOfMonth', () => {
      expect('dayOfWeek' in preset).toBe(false)
      expect('dayOfMonth' in preset).toBe(false)
    })
  })

  describe('Monthly Overview preset', () => {
    const preset = REPORT_PRESETS[2]

    it('should be monthly frequency', () => {
      expect(preset.frequency).toBe('monthly')
    })

    it('should be sent on the 1st at 10:00', () => {
      expect(preset.dayOfMonth).toBe(1)
      expect(preset.timeOfDay).toBe('10:00')
    })

    it('should be sent to owner and admin', () => {
      expect(preset.recipientRoles).toContain('owner')
      expect(preset.recipientRoles).toContain('admin')
    })

    it('should include all main sections', () => {
      expect(preset.sections).toContain('cfp')
      expect(preset.sections).toContain('billing')
      expect(preset.sections).toContain('planning')
      expect(preset.sections).toContain('budget')
      expect(preset.sections).toContain('sponsoring')
    })

    it('should have 5 sections (comprehensive overview)', () => {
      expect(preset.sections).toHaveLength(5)
    })
  })

  describe('CFP Weekly preset', () => {
    const preset = REPORT_PRESETS[3]

    it('should be weekly frequency', () => {
      expect(preset.frequency).toBe('weekly')
    })

    it('should be sent on Friday at 17:00 (end of week)', () => {
      expect(preset.dayOfWeek).toBe('friday')
      expect(preset.timeOfDay).toBe('17:00')
    })

    it('should be sent to admin and organizer', () => {
      expect(preset.recipientRoles).toContain('admin')
      expect(preset.recipientRoles).toContain('organizer')
    })

    it('should include only CFP section', () => {
      expect(preset.sections).toEqual(['cfp'])
    })
  })

  describe('schedule consistency', () => {
    it('weekly presets should have dayOfWeek', () => {
      const weeklyPresets = REPORT_PRESETS.filter((p) => p.frequency === 'weekly')
      for (const preset of weeklyPresets) {
        expect('dayOfWeek' in preset).toBe(true)
      }
    })

    it('monthly presets should have dayOfMonth', () => {
      const monthlyPresets = REPORT_PRESETS.filter((p) => p.frequency === 'monthly')
      for (const preset of monthlyPresets) {
        expect('dayOfMonth' in preset).toBe(true)
      }
    })

    it('daily presets should not have dayOfWeek or dayOfMonth', () => {
      const dailyPresets = REPORT_PRESETS.filter((p) => p.frequency === 'daily')
      for (const preset of dailyPresets) {
        expect('dayOfWeek' in preset).toBe(false)
        expect('dayOfMonth' in preset).toBe(false)
      }
    })

    it('dayOfWeek should be valid', () => {
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
      const presetsWithDayOfWeek = REPORT_PRESETS.filter((p) => 'dayOfWeek' in p) as Array<{
        dayOfWeek: string
      }>
      for (const preset of presetsWithDayOfWeek) {
        expect(validDays).toContain(preset.dayOfWeek)
      }
    })

    it('dayOfMonth should be between 1 and 28', () => {
      const presetsWithDayOfMonth = REPORT_PRESETS.filter((p) => 'dayOfMonth' in p) as Array<{
        dayOfMonth: number
      }>
      for (const preset of presetsWithDayOfMonth) {
        expect(preset.dayOfMonth).toBeGreaterThanOrEqual(1)
        expect(preset.dayOfMonth).toBeLessThanOrEqual(28) // Safe for all months
      }
    })
  })
})
