import { describe, expect, it } from 'vitest'
import {
  type Automation,
  type AutomationStep,
  type ConditionConfig,
  type TriggerConfig,
  buildStepSequence,
  calculateScheduledTriggerTime,
  calculateWaitEndTime,
  canActivateAutomation,
  canEditAutomation,
  canPauseAutomation,
  doesTriggerMatch,
  evaluateCondition,
  formatWaitDuration,
  getNextStep,
  getStepIcon,
  validateStepConfig,
  waitDurationToMs
} from './automation'

describe('automation', () => {
  const now = new Date()

  const createAutomation = (overrides: Partial<Automation> = {}): Automation => ({
    id: 'auto-1',
    eventId: 'evt-1',
    name: 'Test Automation',
    triggerType: 'contact_created',
    triggerConfig: { type: 'contact_created' },
    status: 'draft',
    enrollmentCount: 0,
    completedCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  const createStep = (overrides: Partial<AutomationStep> = {}): AutomationStep => ({
    id: 'step-1',
    automationId: 'auto-1',
    type: 'send_email',
    config: { templateId: 'tpl-1' },
    position: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('waitDurationToMs', () => {
    it('should convert minutes to milliseconds', () => {
      expect(waitDurationToMs(5, 'minutes')).toBe(5 * 60 * 1000)
      expect(waitDurationToMs(30, 'minutes')).toBe(30 * 60 * 1000)
    })

    it('should convert hours to milliseconds', () => {
      expect(waitDurationToMs(2, 'hours')).toBe(2 * 60 * 60 * 1000)
      expect(waitDurationToMs(24, 'hours')).toBe(24 * 60 * 60 * 1000)
    })

    it('should convert days to milliseconds', () => {
      expect(waitDurationToMs(1, 'days')).toBe(24 * 60 * 60 * 1000)
      expect(waitDurationToMs(7, 'days')).toBe(7 * 24 * 60 * 60 * 1000)
    })
  })

  describe('calculateWaitEndTime', () => {
    it('should calculate end time for minutes', () => {
      const start = new Date('2024-01-01T10:00:00Z')
      const end = calculateWaitEndTime(start, 30, 'minutes')
      expect(end.toISOString()).toBe('2024-01-01T10:30:00.000Z')
    })

    it('should calculate end time for hours', () => {
      const start = new Date('2024-01-01T10:00:00Z')
      const end = calculateWaitEndTime(start, 2, 'hours')
      expect(end.toISOString()).toBe('2024-01-01T12:00:00.000Z')
    })

    it('should calculate end time for days', () => {
      const start = new Date('2024-01-01T10:00:00Z')
      const end = calculateWaitEndTime(start, 3, 'days')
      expect(end.toISOString()).toBe('2024-01-04T10:00:00.000Z')
    })
  })

  describe('canActivateAutomation', () => {
    it('should allow activation of valid draft automation', () => {
      const automation = createAutomation({ startStepId: 'step-1' })
      const steps = [createStep()]
      const result = canActivateAutomation(automation, steps)
      expect(result.can).toBe(true)
    })

    it('should reject already active automation', () => {
      const automation = createAutomation({ status: 'active', startStepId: 'step-1' })
      const steps = [createStep()]
      const result = canActivateAutomation(automation, steps)
      expect(result.can).toBe(false)
      expect(result.reason).toContain('already active')
    })

    it('should reject automation without steps', () => {
      const automation = createAutomation({ startStepId: 'step-1' })
      const result = canActivateAutomation(automation, [])
      expect(result.can).toBe(false)
      expect(result.reason).toContain('at least one step')
    })

    it('should reject automation without start step', () => {
      const automation = createAutomation()
      const steps = [createStep()]
      const result = canActivateAutomation(automation, steps)
      expect(result.can).toBe(false)
      expect(result.reason).toContain('start step')
    })

    it('should reject when start step not found', () => {
      const automation = createAutomation({ startStepId: 'non-existent' })
      const steps = [createStep()]
      const result = canActivateAutomation(automation, steps)
      expect(result.can).toBe(false)
      expect(result.reason).toContain('Start step not found')
    })
  })

  describe('canPauseAutomation', () => {
    it('should allow pausing active automation', () => {
      const automation = createAutomation({ status: 'active' })
      expect(canPauseAutomation(automation)).toBe(true)
    })

    it('should not allow pausing draft automation', () => {
      const automation = createAutomation({ status: 'draft' })
      expect(canPauseAutomation(automation)).toBe(false)
    })

    it('should not allow pausing paused automation', () => {
      const automation = createAutomation({ status: 'paused' })
      expect(canPauseAutomation(automation)).toBe(false)
    })
  })

  describe('canEditAutomation', () => {
    it('should allow editing draft automation', () => {
      const automation = createAutomation({ status: 'draft' })
      expect(canEditAutomation(automation)).toBe(true)
    })

    it('should allow editing paused automation', () => {
      const automation = createAutomation({ status: 'paused' })
      expect(canEditAutomation(automation)).toBe(true)
    })

    it('should not allow editing active automation', () => {
      const automation = createAutomation({ status: 'active' })
      expect(canEditAutomation(automation)).toBe(false)
    })
  })

  describe('evaluateCondition', () => {
    const createCondition = (overrides: Partial<ConditionConfig> = {}): ConditionConfig => ({
      field: 'email',
      operator: 'equals',
      value: 'test@example.com',
      ...overrides
    })

    it('should evaluate equals operator', () => {
      const config = createCondition({ field: 'status', value: 'active' })
      expect(evaluateCondition(config, { status: 'active' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { status: 'inactive' }, [], [])).toBe(false)
    })

    it('should evaluate not_equals operator', () => {
      const config = createCondition({ field: 'status', operator: 'not_equals', value: 'active' })
      expect(evaluateCondition(config, { status: 'inactive' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { status: 'active' }, [], [])).toBe(false)
    })

    it('should evaluate contains operator', () => {
      const config = createCondition({ field: 'email', operator: 'contains', value: '@example' })
      expect(evaluateCondition(config, { email: 'test@example.com' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { email: 'test@other.com' }, [], [])).toBe(false)
    })

    it('should evaluate not_contains operator', () => {
      const config = createCondition({
        field: 'email',
        operator: 'not_contains',
        value: '@example'
      })
      expect(evaluateCondition(config, { email: 'test@other.com' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { email: 'test@example.com' }, [], [])).toBe(false)
    })

    it('should evaluate greater_than operator', () => {
      const config = createCondition({ field: 'score', operator: 'greater_than', value: 50 })
      expect(evaluateCondition(config, { score: 75 }, [], [])).toBe(true)
      expect(evaluateCondition(config, { score: 25 }, [], [])).toBe(false)
    })

    it('should evaluate less_than operator', () => {
      const config = createCondition({ field: 'score', operator: 'less_than', value: 50 })
      expect(evaluateCondition(config, { score: 25 }, [], [])).toBe(true)
      expect(evaluateCondition(config, { score: 75 }, [], [])).toBe(false)
    })

    it('should evaluate is_empty operator', () => {
      const config = createCondition({ field: 'company', operator: 'is_empty' })
      expect(evaluateCondition(config, { company: '' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { company: null }, [], [])).toBe(true)
      expect(evaluateCondition(config, {}, [], [])).toBe(true)
      expect(evaluateCondition(config, { company: 'Acme' }, [], [])).toBe(false)
    })

    it('should evaluate is_not_empty operator', () => {
      const config = createCondition({ field: 'company', operator: 'is_not_empty' })
      expect(evaluateCondition(config, { company: 'Acme' }, [], [])).toBe(true)
      expect(evaluateCondition(config, { company: '' }, [], [])).toBe(false)
    })

    it('should evaluate in_segment operator', () => {
      const config = createCondition({ field: 'segment', operator: 'in_segment', value: 'seg-1' })
      expect(evaluateCondition(config, {}, [], ['seg-1', 'seg-2'])).toBe(true)
      expect(evaluateCondition(config, {}, [], ['seg-3'])).toBe(false)
    })

    it('should evaluate not_in_segment operator', () => {
      const config = createCondition({
        field: 'segment',
        operator: 'not_in_segment',
        value: 'seg-1'
      })
      expect(evaluateCondition(config, {}, [], ['seg-3'])).toBe(true)
      expect(evaluateCondition(config, {}, [], ['seg-1'])).toBe(false)
    })

    it('should evaluate has_tag operator', () => {
      const config = createCondition({ field: 'tag', operator: 'has_tag', value: 'vip' })
      expect(evaluateCondition(config, {}, ['vip', 'speaker'], [])).toBe(true)
      expect(evaluateCondition(config, {}, ['speaker'], [])).toBe(false)
    })

    it('should evaluate not_has_tag operator', () => {
      const config = createCondition({ field: 'tag', operator: 'not_has_tag', value: 'vip' })
      expect(evaluateCondition(config, {}, ['speaker'], [])).toBe(true)
      expect(evaluateCondition(config, {}, ['vip'], [])).toBe(false)
    })
  })

  describe('getNextStep', () => {
    it('should return next step by nextStepId', () => {
      const step1 = createStep({ id: 'step-1', nextStepId: 'step-2' })
      const step2 = createStep({ id: 'step-2' })
      const steps = [step1, step2]

      const next = getNextStep(step1, steps)
      expect(next?.id).toBe('step-2')
    })

    it('should return null when no next step', () => {
      const step1 = createStep({ id: 'step-1' })
      const next = getNextStep(step1, [step1])
      expect(next).toBeNull()
    })

    it('should follow true branch for condition with true result', () => {
      const conditionStep = createStep({
        id: 'cond-1',
        type: 'condition',
        config: {
          field: 'status',
          operator: 'equals',
          value: 'active',
          trueBranchStepId: 'step-true',
          falseBranchStepId: 'step-false'
        }
      })
      const trueStep = createStep({ id: 'step-true' })
      const falseStep = createStep({ id: 'step-false' })
      const steps = [conditionStep, trueStep, falseStep]

      const next = getNextStep(conditionStep, steps, true)
      expect(next?.id).toBe('step-true')
    })

    it('should follow false branch for condition with false result', () => {
      const conditionStep = createStep({
        id: 'cond-1',
        type: 'condition',
        config: {
          field: 'status',
          operator: 'equals',
          value: 'active',
          trueBranchStepId: 'step-true',
          falseBranchStepId: 'step-false'
        }
      })
      const trueStep = createStep({ id: 'step-true' })
      const falseStep = createStep({ id: 'step-false' })
      const steps = [conditionStep, trueStep, falseStep]

      const next = getNextStep(conditionStep, steps, false)
      expect(next?.id).toBe('step-false')
    })
  })

  describe('buildStepSequence', () => {
    it('should build linear sequence', () => {
      const step1 = createStep({ id: 'step-1', nextStepId: 'step-2' })
      const step2 = createStep({ id: 'step-2', nextStepId: 'step-3' })
      const step3 = createStep({ id: 'step-3' })
      const steps = [step1, step2, step3]

      const sequence = buildStepSequence('step-1', steps)

      expect(sequence).toHaveLength(3)
      expect(sequence[0].id).toBe('step-1')
      expect(sequence[1].id).toBe('step-2')
      expect(sequence[2].id).toBe('step-3')
    })

    it('should handle single step', () => {
      const step1 = createStep({ id: 'step-1' })
      const sequence = buildStepSequence('step-1', [step1])
      expect(sequence).toHaveLength(1)
    })

    it('should prevent infinite loops', () => {
      const step1 = createStep({ id: 'step-1', nextStepId: 'step-2' })
      const step2 = createStep({ id: 'step-2', nextStepId: 'step-1' })
      const steps = [step1, step2]

      const sequence = buildStepSequence('step-1', steps)

      expect(sequence).toHaveLength(2)
    })

    it('should return empty array for non-existent start step', () => {
      const sequence = buildStepSequence('non-existent', [])
      expect(sequence).toHaveLength(0)
    })
  })

  describe('validateStepConfig', () => {
    it('should validate send_email step', () => {
      expect(validateStepConfig('send_email', { templateId: 'tpl-1' }).valid).toBe(true)
      expect(validateStepConfig('send_email', {}).valid).toBe(false)
    })

    it('should validate wait step', () => {
      expect(validateStepConfig('wait', { duration: 5, unit: 'hours' }).valid).toBe(true)
      expect(validateStepConfig('wait', { duration: 5 }).valid).toBe(false)
      expect(validateStepConfig('wait', { unit: 'hours' }).valid).toBe(false)
      expect(validateStepConfig('wait', { duration: -1, unit: 'hours' }).valid).toBe(false)
    })

    it('should validate condition step', () => {
      expect(validateStepConfig('condition', { field: 'email', operator: 'equals' }).valid).toBe(
        true
      )
      expect(validateStepConfig('condition', { field: 'email' }).valid).toBe(false)
    })

    it('should validate add_tag step', () => {
      expect(validateStepConfig('add_tag', { tagId: 'tag-1' }).valid).toBe(true)
      expect(validateStepConfig('add_tag', {}).valid).toBe(false)
    })

    it('should validate remove_tag step', () => {
      expect(validateStepConfig('remove_tag', { tagId: 'tag-1' }).valid).toBe(true)
      expect(validateStepConfig('remove_tag', {}).valid).toBe(false)
    })

    it('should validate update_field step', () => {
      expect(validateStepConfig('update_field', { fieldName: 'score', value: 100 }).valid).toBe(
        true
      )
      expect(validateStepConfig('update_field', { value: 100 }).valid).toBe(false)
    })

    it('should validate webhook step', () => {
      expect(validateStepConfig('webhook', { url: 'https://example.com/hook' }).valid).toBe(true)
      expect(validateStepConfig('webhook', {}).valid).toBe(false)
    })
  })

  describe('calculateScheduledTriggerTime', () => {
    it('should calculate time before reference', () => {
      const ref = new Date('2024-06-15T10:00:00Z')
      const result = calculateScheduledTriggerTime(ref, 7, 'before')
      expect(result.toISOString()).toBe('2024-06-08T10:00:00.000Z')
    })

    it('should calculate time after reference', () => {
      const ref = new Date('2024-06-15T10:00:00Z')
      const result = calculateScheduledTriggerTime(ref, 3, 'after')
      expect(result.toISOString()).toBe('2024-06-18T10:00:00.000Z')
    })
  })

  describe('formatWaitDuration', () => {
    it('should format singular minute', () => {
      expect(formatWaitDuration(1, 'minutes')).toBe('1 minute')
    })

    it('should format plural minutes', () => {
      expect(formatWaitDuration(30, 'minutes')).toBe('30 minutes')
    })

    it('should format singular hour', () => {
      expect(formatWaitDuration(1, 'hours')).toBe('1 hour')
    })

    it('should format plural hours', () => {
      expect(formatWaitDuration(24, 'hours')).toBe('24 hours')
    })

    it('should format singular day', () => {
      expect(formatWaitDuration(1, 'days')).toBe('1 day')
    })

    it('should format plural days', () => {
      expect(formatWaitDuration(7, 'days')).toBe('7 days')
    })
  })

  describe('getStepIcon', () => {
    it('should return icon for each step type', () => {
      expect(getStepIcon('send_email')).toBe('📧')
      expect(getStepIcon('wait')).toBe('⏳')
      expect(getStepIcon('condition')).toBe('🔀')
      expect(getStepIcon('add_tag')).toBe('🏷️')
      expect(getStepIcon('remove_tag')).toBe('🏷️')
      expect(getStepIcon('update_field')).toBe('✏️')
      expect(getStepIcon('webhook')).toBe('🔗')
    })
  })

  describe('doesTriggerMatch', () => {
    it('should match contact_created without filters', () => {
      const trigger: TriggerConfig = { type: 'contact_created' }
      expect(doesTriggerMatch(trigger, 'contact_created', {})).toBe(true)
    })

    it('should match contact_created with contact type filter', () => {
      const trigger: TriggerConfig = {
        type: 'contact_created',
        contactTypes: ['speaker', 'sponsor']
      }
      expect(doesTriggerMatch(trigger, 'contact_created', { contactType: 'speaker' })).toBe(true)
      expect(doesTriggerMatch(trigger, 'contact_created', { contactType: 'attendee' })).toBe(false)
    })

    it('should match ticket_purchased without filters', () => {
      const trigger: TriggerConfig = { type: 'ticket_purchased' }
      expect(doesTriggerMatch(trigger, 'ticket_purchased', {})).toBe(true)
    })

    it('should match ticket_purchased with ticket type filter', () => {
      const trigger: TriggerConfig = {
        type: 'ticket_purchased',
        ticketTypeIds: ['tt-vip']
      }
      expect(doesTriggerMatch(trigger, 'ticket_purchased', { ticketTypeId: 'tt-vip' })).toBe(true)
      expect(doesTriggerMatch(trigger, 'ticket_purchased', { ticketTypeId: 'tt-std' })).toBe(false)
    })

    it('should match tag_added with matching tag', () => {
      const trigger: TriggerConfig = { type: 'tag_added', tagIds: ['tag-vip', 'tag-speaker'] }
      expect(doesTriggerMatch(trigger, 'tag_added', { tagId: 'tag-vip' })).toBe(true)
      expect(doesTriggerMatch(trigger, 'tag_added', { tagId: 'tag-other' })).toBe(false)
    })

    it('should match consent_given with matching type', () => {
      const trigger: TriggerConfig = { type: 'consent_given', consentType: 'marketing' }
      expect(doesTriggerMatch(trigger, 'consent_given', { consentType: 'marketing' })).toBe(true)
      expect(doesTriggerMatch(trigger, 'consent_given', { consentType: 'newsletter' })).toBe(false)
    })

    it('should not match different trigger types', () => {
      const trigger: TriggerConfig = { type: 'contact_created' }
      expect(doesTriggerMatch(trigger, 'ticket_purchased', {})).toBe(false)
    })

    it('should match simple event triggers', () => {
      const checkedIn: TriggerConfig = { type: 'checked_in' }
      expect(doesTriggerMatch(checkedIn, 'checked_in', {})).toBe(true)

      const submitted: TriggerConfig = { type: 'talk_submitted' }
      expect(doesTriggerMatch(submitted, 'talk_submitted', {})).toBe(true)

      const accepted: TriggerConfig = { type: 'talk_accepted' }
      expect(doesTriggerMatch(accepted, 'talk_accepted', {})).toBe(true)

      const rejected: TriggerConfig = { type: 'talk_rejected' }
      expect(doesTriggerMatch(rejected, 'talk_rejected', {})).toBe(true)
    })
  })
})
