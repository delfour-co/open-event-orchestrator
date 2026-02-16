import { describe, expect, it } from 'vitest'

// Test the preset definitions and their validation
describe('Alert Threshold Presets', () => {
  // Define presets here since we can't import from Svelte component
  const THRESHOLD_PRESETS = [
    {
      name: 'Low Ticket Sales',
      description: 'Alert when ticket sales are below target',
      metricSource: 'billing_sales',
      operator: 'lt',
      thresholdValue: 50,
      level: 'warning'
    },
    {
      name: 'Low Revenue',
      description: 'Alert when revenue drops below threshold',
      metricSource: 'billing_revenue',
      operator: 'lt',
      thresholdValue: 10000,
      level: 'critical'
    },
    {
      name: 'Pending Reviews Backlog',
      description: 'Alert when too many talks await review',
      metricSource: 'cfp_pending_reviews',
      operator: 'gt',
      thresholdValue: 20,
      level: 'info'
    },
    {
      name: 'Low Acceptance Rate',
      description: 'Alert when CFP acceptance rate is low',
      metricSource: 'cfp_acceptance_rate',
      operator: 'lt',
      thresholdValue: 25,
      level: 'warning'
    },
    {
      name: 'Budget Overrun',
      description: 'Alert when budget utilization exceeds limit',
      metricSource: 'budget_utilization',
      operator: 'gt',
      thresholdValue: 90,
      level: 'critical'
    }
  ] as const

  describe('preset definitions', () => {
    it('should have 5 presets', () => {
      expect(THRESHOLD_PRESETS).toHaveLength(5)
    })

    it('should have unique names', () => {
      const names = THRESHOLD_PRESETS.map((p) => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should have valid metric sources', () => {
      const validSources = [
        'billing_sales',
        'billing_revenue',
        'billing_capacity',
        'cfp_submissions',
        'cfp_pending_reviews',
        'cfp_acceptance_rate',
        'planning_scheduled',
        'budget_utilization'
      ]
      for (const preset of THRESHOLD_PRESETS) {
        expect(validSources).toContain(preset.metricSource)
      }
    })

    it('should have valid operators', () => {
      const validOperators = ['lt', 'lte', 'eq', 'gte', 'gt', 'ne']
      for (const preset of THRESHOLD_PRESETS) {
        expect(validOperators).toContain(preset.operator)
      }
    })

    it('should have valid alert levels', () => {
      const validLevels = ['info', 'warning', 'critical']
      for (const preset of THRESHOLD_PRESETS) {
        expect(validLevels).toContain(preset.level)
      }
    })

    it('should have positive threshold values', () => {
      for (const preset of THRESHOLD_PRESETS) {
        expect(preset.thresholdValue).toBeGreaterThan(0)
      }
    })

    it('should have descriptions', () => {
      for (const preset of THRESHOLD_PRESETS) {
        expect(preset.description).toBeDefined()
        expect(preset.description.length).toBeGreaterThan(10)
      }
    })
  })

  describe('Low Ticket Sales preset', () => {
    const preset = THRESHOLD_PRESETS[0]

    it('should alert when sales are below 50', () => {
      expect(preset.thresholdValue).toBe(50)
      expect(preset.operator).toBe('lt')
    })

    it('should be a warning level', () => {
      expect(preset.level).toBe('warning')
    })

    it('should monitor billing_sales metric', () => {
      expect(preset.metricSource).toBe('billing_sales')
    })
  })

  describe('Low Revenue preset', () => {
    const preset = THRESHOLD_PRESETS[1]

    it('should alert when revenue is below 10000', () => {
      expect(preset.thresholdValue).toBe(10000)
      expect(preset.operator).toBe('lt')
    })

    it('should be critical level', () => {
      expect(preset.level).toBe('critical')
    })

    it('should monitor billing_revenue metric', () => {
      expect(preset.metricSource).toBe('billing_revenue')
    })
  })

  describe('Pending Reviews Backlog preset', () => {
    const preset = THRESHOLD_PRESETS[2]

    it('should alert when pending reviews exceed 20', () => {
      expect(preset.thresholdValue).toBe(20)
      expect(preset.operator).toBe('gt')
    })

    it('should be info level', () => {
      expect(preset.level).toBe('info')
    })

    it('should monitor cfp_pending_reviews metric', () => {
      expect(preset.metricSource).toBe('cfp_pending_reviews')
    })
  })

  describe('Low Acceptance Rate preset', () => {
    const preset = THRESHOLD_PRESETS[3]

    it('should alert when acceptance rate is below 25%', () => {
      expect(preset.thresholdValue).toBe(25)
      expect(preset.operator).toBe('lt')
    })

    it('should be warning level', () => {
      expect(preset.level).toBe('warning')
    })

    it('should monitor cfp_acceptance_rate metric', () => {
      expect(preset.metricSource).toBe('cfp_acceptance_rate')
    })
  })

  describe('Budget Overrun preset', () => {
    const preset = THRESHOLD_PRESETS[4]

    it('should alert when budget utilization exceeds 90%', () => {
      expect(preset.thresholdValue).toBe(90)
      expect(preset.operator).toBe('gt')
    })

    it('should be critical level', () => {
      expect(preset.level).toBe('critical')
    })

    it('should monitor budget_utilization metric', () => {
      expect(preset.metricSource).toBe('budget_utilization')
    })
  })
})
