import { z } from 'zod'

/**
 * Operators for field condition evaluation
 */
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in'
])
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>

/**
 * Condition that can trigger field visibility
 */
export const fieldConditionSchema = z.object({
  fieldId: z.string().min(1), // Field to evaluate (e.g., 'formatId', 'level')
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional()
})
export type FieldCondition = z.infer<typeof fieldConditionSchema>

/**
 * Rule that controls visibility of a target field
 */
export const fieldConditionRuleSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  targetFieldId: z.string().min(1), // Field whose visibility is controlled
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  conditions: z.array(fieldConditionSchema).min(1),
  conditionLogic: z.enum(['AND', 'OR']).default('AND'),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})
export type FieldConditionRule = z.infer<typeof fieldConditionRuleSchema>

export type CreateFieldConditionRule = Omit<FieldConditionRule, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateFieldConditionRule = Partial<
  Omit<FieldConditionRule, 'id' | 'editionId' | 'createdAt' | 'updatedAt'>
>

/**
 * Standard CFP form fields that can be conditional
 */
export const CFP_FORM_FIELDS = {
  // Talk fields
  title: { label: 'Title', type: 'text', required: true },
  abstract: { label: 'Abstract', type: 'textarea', required: true },
  description: { label: 'Description', type: 'textarea', required: false },
  language: { label: 'Language', type: 'select', required: false },
  level: { label: 'Level', type: 'select', required: false },
  categoryId: { label: 'Category', type: 'select', required: false },
  formatId: { label: 'Format', type: 'select', required: false },
  notes: { label: 'Notes', type: 'textarea', required: false },
  // Custom fields can be added dynamically
  duration: { label: 'Duration', type: 'number', required: false },
  prerequisites: { label: 'Prerequisites', type: 'textarea', required: false },
  requiredMaterials: { label: 'Required Materials', type: 'textarea', required: false },
  targetAudience: { label: 'Target Audience', type: 'text', required: false },
  mentorRequest: { label: 'Request a Mentor', type: 'checkbox', required: false }
} as const

export type CfpFormFieldId = keyof typeof CFP_FORM_FIELDS

/**
 * Operator labels for UI
 */
export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  in: 'is one of',
  not_in: 'is not one of'
}

/**
 * Operators that don't require a value
 */
export const NO_VALUE_OPERATORS: ConditionOperator[] = ['is_empty', 'is_not_empty']

/**
 * Evaluate a single condition against form data
 */
export function evaluateCondition(
  condition: FieldCondition,
  formData: Record<string, unknown>
): boolean {
  const fieldValue = formData[condition.fieldId]

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value
    case 'not_equals':
      return fieldValue !== condition.value
    case 'contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().includes(condition.value.toLowerCase())
      }
      if (Array.isArray(fieldValue) && typeof condition.value === 'string') {
        return fieldValue.includes(condition.value)
      }
      return false
    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return !fieldValue.toLowerCase().includes(condition.value.toLowerCase())
      }
      if (Array.isArray(fieldValue) && typeof condition.value === 'string') {
        return !fieldValue.includes(condition.value)
      }
      return true
    case 'is_empty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      )
    case 'is_not_empty':
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== '' &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      )
    case 'in':
      if (Array.isArray(condition.value)) {
        return condition.value.includes(String(fieldValue))
      }
      return false
    case 'not_in':
      if (Array.isArray(condition.value)) {
        return !condition.value.includes(String(fieldValue))
      }
      return true
    default:
      return false
  }
}

/**
 * Evaluate a rule with multiple conditions
 */
export function evaluateRule(rule: FieldConditionRule, formData: Record<string, unknown>): boolean {
  if (!rule.isActive) return true // Inactive rules don't hide fields

  const results = rule.conditions.map((condition) => evaluateCondition(condition, formData))

  if (rule.conditionLogic === 'AND') {
    return results.every(Boolean)
  }
  return results.some(Boolean)
}

/**
 * Check if a field should be visible based on all applicable rules
 */
export function shouldShowField(
  fieldId: string,
  rules: FieldConditionRule[],
  formData: Record<string, unknown>
): boolean {
  const applicableRules = rules.filter((r) => r.targetFieldId === fieldId && r.isActive)

  // If no rules apply, show the field
  if (applicableRules.length === 0) return true

  // All applicable rules must pass for field to be visible
  return applicableRules.every((rule) => evaluateRule(rule, formData))
}

/**
 * Get all visible fields based on rules and form data
 */
export function getVisibleFields(
  allFieldIds: string[],
  rules: FieldConditionRule[],
  formData: Record<string, unknown>
): string[] {
  return allFieldIds.filter((fieldId) => shouldShowField(fieldId, rules, formData))
}

/**
 * Validate that required visible fields have values
 */
export function validateVisibleFields(
  formData: Record<string, unknown>,
  rules: FieldConditionRule[],
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = []

  for (const fieldId of requiredFields) {
    const isVisible = shouldShowField(fieldId, rules, formData)
    if (isVisible) {
      const value = formData[fieldId]
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)

      if (isEmpty) {
        missingFields.push(fieldId)
      }
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  }
}
