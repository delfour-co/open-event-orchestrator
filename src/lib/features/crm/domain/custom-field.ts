/**
 * Custom Field Domain Entity
 *
 * Allows event organizers to define custom fields for contacts
 * with various types and validation options.
 */

import { z } from 'zod'

export const customFieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'select',
  'checkbox',
  'url',
  'textarea'
])
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>

export const customFieldOptionsSchema = z.object({
  choices: z.array(z.string()).optional(), // For select type
  placeholder: z.string().optional(),
  min: z.number().optional(), // For number type
  max: z.number().optional(), // For number type
  minLength: z.number().optional(), // For text/textarea
  maxLength: z.number().optional() // For text/textarea
})
export type CustomFieldOptions = z.infer<typeof customFieldOptionsSchema>

export const customFieldSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string().min(1).max(100),
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/),
  fieldType: customFieldTypeSchema,
  description: z.string().max(500).optional(),
  isRequired: z.boolean().default(false),
  options: customFieldOptionsSchema.optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CustomField = z.infer<typeof customFieldSchema>

export interface CreateCustomField {
  eventId: string
  name: string
  key: string
  fieldType: CustomFieldType
  description?: string
  isRequired?: boolean
  options?: CustomFieldOptions
  displayOrder?: number
}

export interface UpdateCustomField {
  name?: string
  description?: string
  isRequired?: boolean
  options?: CustomFieldOptions
  displayOrder?: number
  isActive?: boolean
}

export const contactCustomValueSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  fieldId: z.string(),
  value: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ContactCustomValue = z.infer<typeof contactCustomValueSchema>

// Field type labels for UI
export const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  url: 'URL',
  textarea: 'Long Text'
}

// Field type icons
export const FIELD_TYPE_ICONS: Record<CustomFieldType, string> = {
  text: 'type',
  number: 'hash',
  date: 'calendar',
  select: 'chevron-down',
  checkbox: 'check-square',
  url: 'link',
  textarea: 'align-left'
}

/**
 * Generate a key from a field name
 */
export function generateFieldKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]/, 'f$&')
    .substring(0, 50)
}

type ValidationResult = { valid: boolean; error?: string }

function validateNumberField(
  name: string,
  value: string,
  options?: CustomFieldOptions
): ValidationResult {
  const num = Number(value)
  if (Number.isNaN(num)) {
    return { valid: false, error: `${name} must be a number` }
  }
  if (options?.min !== undefined && num < options.min) {
    return { valid: false, error: `${name} must be at least ${options.min}` }
  }
  if (options?.max !== undefined && num > options.max) {
    return { valid: false, error: `${name} must be at most ${options.max}` }
  }
  return { valid: true }
}

function validateDateField(name: string, value: string): ValidationResult {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { valid: false, error: `${name} must be a valid date` }
  }
  return { valid: true }
}

function validateSelectField(
  name: string,
  value: string,
  options?: CustomFieldOptions
): ValidationResult {
  if (options?.choices && !options.choices.includes(value)) {
    return { valid: false, error: `${name} must be one of: ${options.choices.join(', ')}` }
  }
  return { valid: true }
}

function validateCheckboxField(name: string, value: string): ValidationResult {
  if (value !== 'true' && value !== 'false') {
    return { valid: false, error: `${name} must be true or false` }
  }
  return { valid: true }
}

function validateUrlField(name: string, value: string): ValidationResult {
  try {
    new URL(value)
    return { valid: true }
  } catch {
    return { valid: false, error: `${name} must be a valid URL` }
  }
}

function validateTextField(
  name: string,
  value: string,
  options?: CustomFieldOptions
): ValidationResult {
  if (options?.minLength !== undefined && value.length < options.minLength) {
    return { valid: false, error: `${name} must be at least ${options.minLength} characters` }
  }
  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    return { valid: false, error: `${name} must be at most ${options.maxLength} characters` }
  }
  return { valid: true }
}

/**
 * Validate a custom field value
 */
export function validateFieldValue(
  field: CustomField,
  value: string | undefined
): ValidationResult {
  if (field.isRequired && !value) {
    return { valid: false, error: `${field.name} is required` }
  }

  if (!value) {
    return { valid: true }
  }

  switch (field.fieldType) {
    case 'number':
      return validateNumberField(field.name, value, field.options)
    case 'date':
      return validateDateField(field.name, value)
    case 'select':
      return validateSelectField(field.name, value, field.options)
    case 'checkbox':
      return validateCheckboxField(field.name, value)
    case 'url':
      return validateUrlField(field.name, value)
    case 'text':
    case 'textarea':
      return validateTextField(field.name, value, field.options)
  }
}

/**
 * Format a custom field value for display
 */
export function formatFieldValue(field: CustomField, value: string | undefined): string {
  if (!value) return ''

  switch (field.fieldType) {
    case 'checkbox':
      return value === 'true' ? 'Yes' : 'No'
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'number':
      return Number(value).toLocaleString()
    default:
      return value
  }
}

/**
 * Parse a custom field value for storage
 */
export function parseFieldValue(field: CustomField, value: unknown): string {
  if (value === null || value === undefined) return ''

  switch (field.fieldType) {
    case 'checkbox':
      return value ? 'true' : 'false'
    case 'date':
      if (value instanceof Date) {
        return value.toISOString()
      }
      return String(value)
    default:
      return String(value)
  }
}

/**
 * Build template variable name from field
 */
export function buildTemplateVariable(field: CustomField): string {
  return `{{custom.${field.key}}}`
}
