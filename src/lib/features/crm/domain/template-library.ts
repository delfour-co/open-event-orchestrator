/**
 * Template Library Domain Entity
 *
 * Organizes email templates with categories, tags, and pre-built templates.
 */

import { z } from 'zod'

export const templateCategorySchema = z.enum([
  'invitation',
  'confirmation',
  'reminder',
  'thank_you',
  'newsletter',
  'cfp',
  'speaker',
  'sponsor',
  'custom'
])
export type TemplateCategory = z.infer<typeof templateCategorySchema>

export const templateVariableSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  example: z.string(),
  category: z.enum(['contact', 'event', 'edition', 'ticket', 'speaker', 'custom'])
})
export type TemplateVariable = z.infer<typeof templateVariableSchema>

export const libraryTemplateSchema = z.object({
  id: z.string(),
  eventId: z.string().optional(), // null for global templates
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: templateCategorySchema,
  subject: z.string().min(1).max(200),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  isGlobal: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  usageCount: z.number().int().min(0).default(0),
  createdBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type LibraryTemplate = z.infer<typeof libraryTemplateSchema>

export interface CreateLibraryTemplate {
  eventId?: string
  name: string
  description?: string
  category: TemplateCategory
  subject: string
  htmlContent: string
  textContent?: string
  tags?: string[]
  isGlobal?: boolean
  createdBy?: string
}

export interface UpdateLibraryTemplate {
  name?: string
  description?: string
  category?: TemplateCategory
  subject?: string
  htmlContent?: string
  textContent?: string
  tags?: string[]
  isFavorite?: boolean
  isPinned?: boolean
}

export interface TemplateSearchOptions {
  query?: string
  category?: TemplateCategory
  tags?: string[]
  isGlobal?: boolean
  isFavorite?: boolean
  isPinned?: boolean
}

// Category labels for UI
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  invitation: 'Invitation',
  confirmation: 'Confirmation',
  reminder: 'Reminder',
  thank_you: 'Thank You',
  newsletter: 'Newsletter',
  cfp: 'Call for Papers',
  speaker: 'Speaker Communications',
  sponsor: 'Sponsor Communications',
  custom: 'Custom'
}

// Category icons
export const TEMPLATE_CATEGORY_ICONS: Record<TemplateCategory, string> = {
  invitation: 'mail',
  confirmation: 'check-circle',
  reminder: 'bell',
  thank_you: 'heart',
  newsletter: 'newspaper',
  cfp: 'mic',
  speaker: 'user',
  sponsor: 'briefcase',
  custom: 'file-text'
}

// Available template variables
export const LIBRARY_TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Contact variables
  {
    key: 'contact.firstName',
    name: 'First Name',
    description: 'Contact first name',
    example: 'John',
    category: 'contact'
  },
  {
    key: 'contact.lastName',
    name: 'Last Name',
    description: 'Contact last name',
    example: 'Doe',
    category: 'contact'
  },
  {
    key: 'contact.fullName',
    name: 'Full Name',
    description: 'Contact full name',
    example: 'John Doe',
    category: 'contact'
  },
  {
    key: 'contact.email',
    name: 'Email',
    description: 'Contact email address',
    example: 'john@example.com',
    category: 'contact'
  },
  {
    key: 'contact.company',
    name: 'Company',
    description: 'Contact company name',
    example: 'ACME Inc',
    category: 'contact'
  },

  // Event variables
  {
    key: 'event.name',
    name: 'Event Name',
    description: 'Name of the event',
    example: 'DevConf',
    category: 'event'
  },
  {
    key: 'event.description',
    name: 'Event Description',
    description: 'Event description',
    example: 'Annual developer conference',
    category: 'event'
  },
  {
    key: 'event.website',
    name: 'Event Website',
    description: 'Event website URL',
    example: 'https://devconf.io',
    category: 'event'
  },

  // Edition variables
  {
    key: 'edition.name',
    name: 'Edition Name',
    description: 'Name of the edition',
    example: 'DevConf 2024',
    category: 'edition'
  },
  {
    key: 'edition.startDate',
    name: 'Start Date',
    description: 'Edition start date',
    example: 'March 15, 2024',
    category: 'edition'
  },
  {
    key: 'edition.endDate',
    name: 'End Date',
    description: 'Edition end date',
    example: 'March 17, 2024',
    category: 'edition'
  },
  {
    key: 'edition.venue',
    name: 'Venue',
    description: 'Event venue name',
    example: 'Conference Center',
    category: 'edition'
  },
  {
    key: 'edition.city',
    name: 'City',
    description: 'Event city',
    example: 'Paris',
    category: 'edition'
  },
  {
    key: 'edition.country',
    name: 'Country',
    description: 'Event country',
    example: 'France',
    category: 'edition'
  },
  {
    key: 'edition.registrationUrl',
    name: 'Registration URL',
    description: 'Link to registration',
    example: 'https://devconf.io/register',
    category: 'edition'
  },

  // Ticket variables
  {
    key: 'ticket.type',
    name: 'Ticket Type',
    description: 'Type of ticket purchased',
    example: 'Early Bird',
    category: 'ticket'
  },
  {
    key: 'ticket.price',
    name: 'Ticket Price',
    description: 'Ticket price',
    example: '€99.00',
    category: 'ticket'
  },
  {
    key: 'ticket.qrCode',
    name: 'QR Code',
    description: 'Ticket QR code image',
    example: '[QR Code]',
    category: 'ticket'
  },
  {
    key: 'ticket.confirmationNumber',
    name: 'Confirmation Number',
    description: 'Order confirmation number',
    example: 'ORD-12345',
    category: 'ticket'
  },

  // Speaker variables
  {
    key: 'speaker.talkTitle',
    name: 'Talk Title',
    description: 'Title of the talk',
    example: 'Building Scalable APIs',
    category: 'speaker'
  },
  {
    key: 'speaker.talkAbstract',
    name: 'Talk Abstract',
    description: 'Talk abstract',
    example: 'In this session...',
    category: 'speaker'
  },
  {
    key: 'speaker.sessionTime',
    name: 'Session Time',
    description: 'Scheduled session time',
    example: '10:00 AM - 11:00 AM',
    category: 'speaker'
  },
  {
    key: 'speaker.sessionRoom',
    name: 'Session Room',
    description: 'Session room/track',
    example: 'Main Hall',
    category: 'speaker'
  },

  // Custom variables
  {
    key: 'custom.unsubscribeUrl',
    name: 'Unsubscribe URL',
    description: 'One-click unsubscribe link',
    example: 'https://...',
    category: 'custom'
  },
  {
    key: 'custom.preferencesUrl',
    name: 'Preferences URL',
    description: 'Email preferences link',
    example: 'https://...',
    category: 'custom'
  },
  {
    key: 'custom.viewInBrowser',
    name: 'View in Browser',
    description: 'View email in browser link',
    example: 'https://...',
    category: 'custom'
  }
]

/**
 * Get variables by category
 */
export function getVariablesByCategory(category: TemplateVariable['category']): TemplateVariable[] {
  return LIBRARY_TEMPLATE_VARIABLES.filter((v) => v.category === category)
}

/**
 * Get all variable categories
 */
export function getVariableCategories(): TemplateVariable['category'][] {
  return [...new Set(LIBRARY_TEMPLATE_VARIABLES.map((v) => v.category))]
}

/**
 * Extract variables used in template content
 */
export function extractUsedVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const matches = content.match(regex) || []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim()))]
}

/**
 * Validate that all used variables are valid
 */
export function validateTemplateVariables(content: string): {
  valid: boolean
  invalidVariables: string[]
} {
  const usedVars = extractUsedVariables(content)
  const validKeys = LIBRARY_TEMPLATE_VARIABLES.map((v) => v.key)
  const customFieldRegex = /^custom\./

  const invalidVariables = usedVars.filter(
    (v) => !validKeys.includes(v) && !customFieldRegex.test(v)
  )

  return {
    valid: invalidVariables.length === 0,
    invalidVariables
  }
}

/**
 * Replace variables with example values for preview
 */
export function interpolateWithExamples(content: string): string {
  let result = content

  for (const variable of LIBRARY_TEMPLATE_VARIABLES) {
    const pattern = new RegExp(`\\{\\{\\s*${variable.key.replace('.', '\\.')}\\s*\\}\\}`, 'g')
    result = result.replace(pattern, variable.example)
  }

  return result
}

/**
 * Build variable insertion string
 */
export function buildVariableInsert(variable: TemplateVariable): string {
  return `{{${variable.key}}}`
}

/**
 * Generate clone name for template
 */
export function generateCloneName(originalName: string): string {
  const copyMatch = originalName.match(/\(copy(?:\s+(\d+))?\)$/)

  if (copyMatch) {
    const number = copyMatch[1] ? Number.parseInt(copyMatch[1], 10) + 1 : 2
    return originalName.replace(/\(copy(?:\s+\d+)?\)$/, `(copy ${number})`)
  }

  return `${originalName} (copy)`
}

/**
 * Filter templates by search options
 */
export function matchesSearchCriteria(
  template: LibraryTemplate,
  options: TemplateSearchOptions
): boolean {
  if (options.query) {
    const query = options.query.toLowerCase()
    const matchesName = template.name.toLowerCase().includes(query)
    const matchesDescription = template.description?.toLowerCase().includes(query)
    const matchesTags = template.tags.some((t) => t.toLowerCase().includes(query))
    if (!matchesName && !matchesDescription && !matchesTags) return false
  }

  if (options.category && template.category !== options.category) return false
  if (options.isGlobal !== undefined && template.isGlobal !== options.isGlobal) return false
  if (options.isFavorite !== undefined && template.isFavorite !== options.isFavorite) return false
  if (options.isPinned !== undefined && template.isPinned !== options.isPinned) return false

  if (options.tags && options.tags.length > 0) {
    const hasAllTags = options.tags.every((t) => template.tags.includes(t))
    if (!hasAllTags) return false
  }

  return true
}

/**
 * Sort templates with pinned first, then by usage
 */
export function sortTemplates(templates: LibraryTemplate[]): LibraryTemplate[] {
  return [...templates].sort((a, b) => {
    // Pinned first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Then favorites
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1

    // Then by usage count
    return b.usageCount - a.usageCount
  })
}
