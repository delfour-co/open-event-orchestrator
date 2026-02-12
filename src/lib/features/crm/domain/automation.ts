/**
 * Email Automation Domain Entity
 *
 * Defines automation workflows with triggers, steps, and execution logic.
 */

import { z } from 'zod'

// Trigger types that can start a workflow
export const automationTriggerTypeSchema = z.enum([
  'contact_created',
  'ticket_purchased',
  'checked_in',
  'tag_added',
  'consent_given',
  'scheduled_date',
  'talk_submitted',
  'talk_accepted',
  'talk_rejected'
])
export type AutomationTriggerType = z.infer<typeof automationTriggerTypeSchema>

// Step types for workflow actions
export const automationStepTypeSchema = z.enum([
  'send_email',
  'wait',
  'condition',
  'add_tag',
  'remove_tag',
  'update_field',
  'webhook'
])
export type AutomationStepType = z.infer<typeof automationStepTypeSchema>

// Automation status
export const automationStatusSchema = z.enum(['draft', 'active', 'paused'])
export type AutomationStatus = z.infer<typeof automationStatusSchema>

// Step execution status
export const stepExecutionStatusSchema = z.enum([
  'pending',
  'executing',
  'completed',
  'failed',
  'skipped'
])
export type StepExecutionStatus = z.infer<typeof stepExecutionStatusSchema>

// Condition operators for branching
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
  'in_segment',
  'not_in_segment',
  'has_tag',
  'not_has_tag'
])
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>

// Wait unit for delays
export const waitUnitSchema = z.enum(['minutes', 'hours', 'days'])
export type WaitUnit = z.infer<typeof waitUnitSchema>

// Trigger configuration based on type
export const triggerConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('contact_created'),
    contactTypes: z.array(z.string()).optional()
  }),
  z.object({
    type: z.literal('ticket_purchased'),
    ticketTypeIds: z.array(z.string()).optional()
  }),
  z.object({
    type: z.literal('checked_in')
  }),
  z.object({
    type: z.literal('tag_added'),
    tagIds: z.array(z.string()).min(1)
  }),
  z.object({
    type: z.literal('consent_given'),
    consentType: z.enum(['marketing', 'newsletter', 'partner'])
  }),
  z.object({
    type: z.literal('scheduled_date'),
    dateField: z.string(),
    offsetDays: z.number().int(),
    offsetDirection: z.enum(['before', 'after'])
  }),
  z.object({
    type: z.literal('talk_submitted')
  }),
  z.object({
    type: z.literal('talk_accepted')
  }),
  z.object({
    type: z.literal('talk_rejected')
  })
])
export type TriggerConfig = z.infer<typeof triggerConfigSchema>

// Step configurations based on type
export const sendEmailConfigSchema = z.object({
  templateId: z.string(),
  subject: z.string().optional(),
  fromName: z.string().optional()
})
export type SendEmailConfig = z.infer<typeof sendEmailConfigSchema>

export const waitConfigSchema = z.object({
  duration: z.number().int().min(1),
  unit: waitUnitSchema
})
export type WaitConfig = z.infer<typeof waitConfigSchema>

export const conditionConfigSchema = z.object({
  field: z.string(),
  operator: conditionOperatorSchema,
  value: z.unknown().optional(),
  trueBranchStepId: z.string().optional(),
  falseBranchStepId: z.string().optional()
})
export type ConditionConfig = z.infer<typeof conditionConfigSchema>

export const addTagConfigSchema = z.object({
  tagId: z.string()
})
export type AddTagConfig = z.infer<typeof addTagConfigSchema>

export const removeTagConfigSchema = z.object({
  tagId: z.string()
})
export type RemoveTagConfig = z.infer<typeof removeTagConfigSchema>

export const updateFieldConfigSchema = z.object({
  fieldName: z.string(),
  value: z.unknown()
})
export type UpdateFieldConfig = z.infer<typeof updateFieldConfigSchema>

export const webhookConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT']).default('POST'),
  headers: z.record(z.string()).optional()
})
export type WebhookConfig = z.infer<typeof webhookConfigSchema>

export type StepConfig =
  | SendEmailConfig
  | WaitConfig
  | ConditionConfig
  | AddTagConfig
  | RemoveTagConfig
  | UpdateFieldConfig
  | WebhookConfig

// Automation schema
export const automationSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  editionId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  triggerType: automationTriggerTypeSchema,
  triggerConfig: z.record(z.unknown()),
  status: automationStatusSchema.default('draft'),
  startStepId: z.string().optional(),
  enrollmentCount: z.number().int().min(0).default(0),
  completedCount: z.number().int().min(0).default(0),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type Automation = z.infer<typeof automationSchema>

// Automation step schema
export const automationStepSchema = z.object({
  id: z.string(),
  automationId: z.string(),
  type: automationStepTypeSchema,
  name: z.string().optional(),
  config: z.record(z.unknown()),
  position: z.number().int().min(0),
  nextStepId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type AutomationStep = z.infer<typeof automationStepSchema>

// Automation enrollment (contact in workflow)
export const automationEnrollmentSchema = z.object({
  id: z.string(),
  automationId: z.string(),
  contactId: z.string(),
  currentStepId: z.string().optional(),
  status: z.enum(['active', 'completed', 'exited', 'failed']),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  exitedAt: z.date().optional(),
  exitReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type AutomationEnrollment = z.infer<typeof automationEnrollmentSchema>

// Automation log entry
export const automationLogSchema = z.object({
  id: z.string(),
  automationId: z.string(),
  enrollmentId: z.string(),
  contactId: z.string(),
  stepId: z.string(),
  stepType: automationStepTypeSchema,
  status: stepExecutionStatusSchema,
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  executedAt: z.date(),
  createdAt: z.date()
})
export type AutomationLog = z.infer<typeof automationLogSchema>

// Input types
export interface CreateAutomation {
  eventId: string
  editionId?: string
  name: string
  description?: string
  triggerType: AutomationTriggerType
  triggerConfig: TriggerConfig
  createdBy?: string
}

export interface UpdateAutomation {
  name?: string
  description?: string
  triggerConfig?: TriggerConfig
}

export interface CreateAutomationStep {
  automationId: string
  type: AutomationStepType
  name?: string
  config: StepConfig
  position: number
  nextStepId?: string
}

export interface UpdateAutomationStep {
  name?: string
  config?: StepConfig
  nextStepId?: string | null
}

// UI labels
export const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  contact_created: 'Contact Created',
  ticket_purchased: 'Ticket Purchased',
  checked_in: 'Checked In',
  tag_added: 'Tag Added',
  consent_given: 'Consent Given',
  scheduled_date: 'Scheduled Date',
  talk_submitted: 'Talk Submitted',
  talk_accepted: 'Talk Accepted',
  talk_rejected: 'Talk Rejected'
}

export const STEP_TYPE_LABELS: Record<AutomationStepType, string> = {
  send_email: 'Send Email',
  wait: 'Wait',
  condition: 'Condition',
  add_tag: 'Add Tag',
  remove_tag: 'Remove Tag',
  update_field: 'Update Field',
  webhook: 'Webhook'
}

export const AUTOMATION_STATUS_LABELS: Record<AutomationStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused'
}

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  not_contains: 'Does not contain',
  greater_than: 'Greater than',
  less_than: 'Less than',
  is_empty: 'Is empty',
  is_not_empty: 'Is not empty',
  in_segment: 'Is in segment',
  not_in_segment: 'Is not in segment',
  has_tag: 'Has tag',
  not_has_tag: 'Does not have tag'
}

export const WAIT_UNIT_LABELS: Record<WaitUnit, string> = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days'
}

/**
 * Convert wait duration to milliseconds
 */
export function waitDurationToMs(duration: number, unit: WaitUnit): number {
  switch (unit) {
    case 'minutes':
      return duration * 60 * 1000
    case 'hours':
      return duration * 60 * 60 * 1000
    case 'days':
      return duration * 24 * 60 * 60 * 1000
  }
}

/**
 * Calculate when a wait step should complete
 */
export function calculateWaitEndTime(startTime: Date, duration: number, unit: WaitUnit): Date {
  return new Date(startTime.getTime() + waitDurationToMs(duration, unit))
}

/**
 * Check if automation can be activated
 */
export function canActivateAutomation(
  automation: Automation,
  steps: AutomationStep[]
): { can: boolean; reason?: string } {
  if (automation.status === 'active') {
    return { can: false, reason: 'Automation is already active' }
  }

  if (steps.length === 0) {
    return { can: false, reason: 'Automation must have at least one step' }
  }

  if (!automation.startStepId) {
    return { can: false, reason: 'Automation must have a start step defined' }
  }

  const startStep = steps.find((s) => s.id === automation.startStepId)
  if (!startStep) {
    return { can: false, reason: 'Start step not found' }
  }

  return { can: true }
}

/**
 * Check if automation can be paused
 */
export function canPauseAutomation(automation: Automation): boolean {
  return automation.status === 'active'
}

/**
 * Check if automation can be edited
 */
export function canEditAutomation(automation: Automation): boolean {
  return automation.status !== 'active'
}

/**
 * Evaluate a condition against contact data
 */
export function evaluateCondition(
  config: ConditionConfig,
  contactData: Record<string, unknown>,
  contactTags: string[],
  segmentIds: string[]
): boolean {
  const fieldValue = contactData[config.field]
  const compareValue = config.value

  switch (config.operator) {
    case 'equals':
      return fieldValue === compareValue
    case 'not_equals':
      return fieldValue !== compareValue
    case 'contains':
      return String(fieldValue ?? '').includes(String(compareValue ?? ''))
    case 'not_contains':
      return !String(fieldValue ?? '').includes(String(compareValue ?? ''))
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue)
    case 'less_than':
      return Number(fieldValue) < Number(compareValue)
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === ''
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
    case 'in_segment':
      return segmentIds.includes(String(compareValue))
    case 'not_in_segment':
      return !segmentIds.includes(String(compareValue))
    case 'has_tag':
      return contactTags.includes(String(compareValue))
    case 'not_has_tag':
      return !contactTags.includes(String(compareValue))
  }
}

/**
 * Get the next step to execute based on current step and condition result
 */
export function getNextStep(
  currentStep: AutomationStep,
  steps: AutomationStep[],
  conditionResult?: boolean
): AutomationStep | null {
  // For condition steps, use branch paths
  if (currentStep.type === 'condition' && conditionResult !== undefined) {
    const config = currentStep.config as ConditionConfig
    const nextStepId = conditionResult ? config.trueBranchStepId : config.falseBranchStepId
    if (nextStepId) {
      return steps.find((s) => s.id === nextStepId) ?? null
    }
    return null
  }

  // For other steps, use nextStepId
  if (currentStep.nextStepId) {
    return steps.find((s) => s.id === currentStep.nextStepId) ?? null
  }

  return null
}

/**
 * Build a linear step sequence from start step
 */
export function buildStepSequence(startStepId: string, steps: AutomationStep[]): AutomationStep[] {
  const sequence: AutomationStep[] = []
  const visited = new Set<string>()

  let currentId: string | undefined = startStepId

  while (currentId && !visited.has(currentId)) {
    const step = steps.find((s) => s.id === currentId)
    if (!step) break

    visited.add(currentId)
    sequence.push(step)
    currentId = step.nextStepId
  }

  return sequence
}

type StepValidationResult = { valid: boolean; error?: string }

function validateSendEmailStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.templateId) {
    return { valid: false, error: 'Template ID is required' }
  }
  return { valid: true }
}

function validateWaitStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.duration || !config.unit) {
    return { valid: false, error: 'Duration and unit are required' }
  }
  if (typeof config.duration !== 'number' || config.duration < 1) {
    return { valid: false, error: 'Duration must be a positive number' }
  }
  return { valid: true }
}

function validateConditionStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.field || !config.operator) {
    return { valid: false, error: 'Field and operator are required' }
  }
  return { valid: true }
}

function validateTagStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.tagId) {
    return { valid: false, error: 'Tag ID is required' }
  }
  return { valid: true }
}

function validateUpdateFieldStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.fieldName) {
    return { valid: false, error: 'Field name is required' }
  }
  return { valid: true }
}

function validateWebhookStep(config: Record<string, unknown>): StepValidationResult {
  if (!config.url) {
    return { valid: false, error: 'URL is required' }
  }
  return { valid: true }
}

const stepValidators: Record<
  AutomationStepType,
  (config: Record<string, unknown>) => StepValidationResult
> = {
  send_email: validateSendEmailStep,
  wait: validateWaitStep,
  condition: validateConditionStep,
  add_tag: validateTagStep,
  remove_tag: validateTagStep,
  update_field: validateUpdateFieldStep,
  webhook: validateWebhookStep
}

/**
 * Validate step configuration based on type
 */
export function validateStepConfig(
  type: AutomationStepType,
  config: Record<string, unknown>
): StepValidationResult {
  const validator = stepValidators[type]
  return validator(config)
}

/**
 * Calculate scheduled trigger time based on date field and offset
 */
export function calculateScheduledTriggerTime(
  referenceDate: Date,
  offsetDays: number,
  direction: 'before' | 'after'
): Date {
  const offset = direction === 'before' ? -offsetDays : offsetDays
  const result = new Date(referenceDate)
  result.setDate(result.getDate() + offset)
  return result
}

/**
 * Format wait duration for display
 */
export function formatWaitDuration(duration: number, unit: WaitUnit): string {
  const label = WAIT_UNIT_LABELS[unit].toLowerCase()
  return `${duration} ${duration === 1 ? label.slice(0, -1) : label}`
}

/**
 * Get step icon based on type
 */
export function getStepIcon(type: AutomationStepType): string {
  const icons: Record<AutomationStepType, string> = {
    send_email: '📧',
    wait: '⏳',
    condition: '🔀',
    add_tag: '🏷️',
    remove_tag: '🏷️',
    update_field: '✏️',
    webhook: '🔗'
  }
  return icons[type]
}

/**
 * Check if a trigger matches an event
 */
export function doesTriggerMatch(
  trigger: TriggerConfig,
  eventType: AutomationTriggerType,
  eventData: Record<string, unknown>
): boolean {
  if (trigger.type !== eventType) {
    return false
  }

  switch (trigger.type) {
    case 'contact_created':
      if (trigger.contactTypes?.length) {
        return trigger.contactTypes.includes(eventData.contactType as string)
      }
      return true

    case 'ticket_purchased':
      if (trigger.ticketTypeIds?.length) {
        return trigger.ticketTypeIds.includes(eventData.ticketTypeId as string)
      }
      return true

    case 'tag_added':
      return trigger.tagIds.includes(eventData.tagId as string)

    case 'consent_given':
      return trigger.consentType === eventData.consentType

    default:
      return true
  }
}
