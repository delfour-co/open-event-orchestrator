import { z } from 'zod'
import { checklistItemPrioritySchema } from './checklist-item'

export const eventTypes = ['conference', 'meetup', 'workshop', 'hackathon', 'other'] as const
export const eventTypeSchema = z.enum(eventTypes)

export type EventType = z.infer<typeof eventTypeSchema>

export const templateItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  estimatedAmount: z.number().int().min(0).default(0),
  priority: checklistItemPrioritySchema.default('medium'),
  isVariable: z.boolean().default(false),
  variableUnit: z.string().max(50).optional()
})

export type TemplateItem = z.infer<typeof templateItemSchema>

export const budgetTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  eventType: eventTypeSchema,
  isGlobal: z.boolean().default(false),
  organizationId: z.string().optional(),
  items: z.array(templateItemSchema).default([]),
  usageCount: z.number().int().min(0).default(0),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetTemplate = z.infer<typeof budgetTemplateSchema>

export const createBudgetTemplateSchema = budgetTemplateSchema.omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true
})

export type CreateBudgetTemplate = z.infer<typeof createBudgetTemplateSchema>

export const updateBudgetTemplateSchema = createBudgetTemplateSchema.partial().omit({
  createdBy: true
})

export type UpdateBudgetTemplate = z.infer<typeof updateBudgetTemplateSchema>

export const getEventTypeLabel = (eventType: EventType): string => {
  const labels: Record<EventType, string> = {
    conference: 'Conference',
    meetup: 'Meetup',
    workshop: 'Workshop',
    hackathon: 'Hackathon',
    other: 'Other'
  }
  return labels[eventType]
}

export const getEventTypeIcon = (eventType: EventType): string => {
  const icons: Record<EventType, string> = {
    conference: 'presentation',
    meetup: 'users',
    workshop: 'wrench',
    hackathon: 'code',
    other: 'calendar'
  }
  return icons[eventType]
}

export const calculateTemplateTotal = (items: TemplateItem[]): number => {
  return items.reduce((sum, item) => sum + item.estimatedAmount, 0)
}

// Event sizes for template categorization
export const eventSizes = ['small', 'medium', 'large'] as const
export type EventSize = (typeof eventSizes)[number]

export const getEventSizeLabel = (size: EventSize): string => {
  const labels: Record<EventSize, string> = {
    small: 'Small (up to 100)',
    medium: 'Medium (100-500)',
    large: 'Large (500+)'
  }
  return labels[size]
}

export const DEFAULT_BUDGET_TEMPLATES: Omit<
  BudgetTemplate,
  'id' | 'createdBy' | 'createdAt' | 'updatedAt'
>[] = [
  // ============ SMALL EVENTS (up to 100 attendees) ============
  {
    name: 'Meetup (Small)',
    description: 'Monthly community meetup with 20-50 attendees',
    eventType: 'meetup',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue rental',
        category: 'venue',
        estimatedAmount: 0,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Pizza & drinks',
        category: 'catering',
        estimatedAmount: 15,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Speaker gift',
        category: 'speakers',
        estimatedAmount: 50,
        priority: 'low',
        isVariable: false
      },
      {
        name: 'Streaming/Recording',
        category: 'equipment',
        estimatedAmount: 0,
        priority: 'low',
        isVariable: false
      }
    ]
  },
  {
    name: 'Workshop (Small)',
    description: 'Hands-on workshop with 15-40 participants',
    eventType: 'workshop',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Training room',
        category: 'venue',
        estimatedAmount: 500,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Instructor fee',
        category: 'speakers',
        estimatedAmount: 1000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Materials',
        category: 'supplies',
        estimatedAmount: 20,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Lunch & coffee',
        category: 'catering',
        estimatedAmount: 25,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      }
    ]
  },
  {
    name: 'Conference (Small)',
    description: 'Single-track conference with 50-100 attendees',
    eventType: 'conference',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue rental',
        category: 'venue',
        estimatedAmount: 2000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Catering',
        category: 'catering',
        estimatedAmount: 30,
        priority: 'high',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Speaker travel',
        category: 'speakers',
        estimatedAmount: 1500,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Speaker accommodation',
        category: 'speakers',
        estimatedAmount: 800,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Marketing',
        category: 'marketing',
        estimatedAmount: 300,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Badges & lanyards',
        category: 'supplies',
        estimatedAmount: 5,
        priority: 'low',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'A/V equipment',
        category: 'equipment',
        estimatedAmount: 500,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Insurance',
        category: 'admin',
        estimatedAmount: 200,
        priority: 'low',
        isVariable: false
      }
    ]
  },

  // ============ MEDIUM EVENTS (100-500 attendees) ============
  {
    name: 'Conference (Medium)',
    description: 'Multi-track conference with 100-300 attendees',
    eventType: 'conference',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue rental',
        category: 'venue',
        estimatedAmount: 8000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Catering',
        category: 'catering',
        estimatedAmount: 35,
        priority: 'high',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Speaker travel',
        category: 'speakers',
        estimatedAmount: 5000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Speaker accommodation',
        category: 'speakers',
        estimatedAmount: 3000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Speaker dinner',
        category: 'speakers',
        estimatedAmount: 1000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Marketing & promotion',
        category: 'marketing',
        estimatedAmount: 1500,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Badges & lanyards',
        category: 'supplies',
        estimatedAmount: 5,
        priority: 'low',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Swag bag',
        category: 'supplies',
        estimatedAmount: 10,
        priority: 'low',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'A/V equipment & technician',
        category: 'equipment',
        estimatedAmount: 3000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Photography',
        category: 'equipment',
        estimatedAmount: 800,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Signage & banners',
        category: 'supplies',
        estimatedAmount: 500,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Insurance',
        category: 'admin',
        estimatedAmount: 500,
        priority: 'low',
        isVariable: false
      }
    ]
  },
  {
    name: 'Hackathon (Medium)',
    description: '24-48h hackathon with 80-200 participants',
    eventType: 'hackathon',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue (multi-day)',
        category: 'venue',
        estimatedAmount: 3000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Meals & snacks',
        category: 'catering',
        estimatedAmount: 50,
        priority: 'high',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Prizes (1st place)',
        category: 'prizes',
        estimatedAmount: 3000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Prizes (2nd place)',
        category: 'prizes',
        estimatedAmount: 1500,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Prizes (3rd place)',
        category: 'prizes',
        estimatedAmount: 750,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Mentor travel',
        category: 'speakers',
        estimatedAmount: 1000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'T-shirts',
        category: 'supplies',
        estimatedAmount: 15,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Stickers & swag',
        category: 'supplies',
        estimatedAmount: 5,
        priority: 'low',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Power strips & cables',
        category: 'equipment',
        estimatedAmount: 300,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Coffee & energy drinks',
        category: 'catering',
        estimatedAmount: 500,
        priority: 'medium',
        isVariable: false
      }
    ]
  },

  // ============ LARGE EVENTS (500+ attendees) ============
  {
    name: 'Conference (Large)',
    description: 'Major conference with 500-1500 attendees',
    eventType: 'conference',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue rental',
        category: 'venue',
        estimatedAmount: 30000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Catering',
        category: 'catering',
        estimatedAmount: 40,
        priority: 'high',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Speaker travel',
        category: 'speakers',
        estimatedAmount: 15000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Speaker accommodation',
        category: 'speakers',
        estimatedAmount: 10000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Speaker dinner',
        category: 'speakers',
        estimatedAmount: 3000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Keynote speaker fee',
        category: 'speakers',
        estimatedAmount: 5000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Marketing & advertising',
        category: 'marketing',
        estimatedAmount: 8000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Website & registration',
        category: 'marketing',
        estimatedAmount: 2000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Badges & lanyards',
        category: 'supplies',
        estimatedAmount: 4,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'Swag bag',
        category: 'supplies',
        estimatedAmount: 15,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'attendee'
      },
      {
        name: 'A/V production',
        category: 'equipment',
        estimatedAmount: 12000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Live streaming',
        category: 'equipment',
        estimatedAmount: 5000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Photography & videography',
        category: 'equipment',
        estimatedAmount: 3000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Signage & wayfinding',
        category: 'supplies',
        estimatedAmount: 2000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Party / social event',
        category: 'social',
        estimatedAmount: 8000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Security',
        category: 'admin',
        estimatedAmount: 2000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Insurance',
        category: 'admin',
        estimatedAmount: 1500,
        priority: 'low',
        isVariable: false
      },
      {
        name: 'Contingency (10%)',
        category: 'admin',
        estimatedAmount: 10000,
        priority: 'low',
        isVariable: false
      }
    ]
  },
  {
    name: 'Hackathon (Large)',
    description: 'Major hackathon with 300-500 participants',
    eventType: 'hackathon',
    isGlobal: true,
    usageCount: 0,
    items: [
      {
        name: 'Venue (multi-day)',
        category: 'venue',
        estimatedAmount: 10000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Meals & snacks',
        category: 'catering',
        estimatedAmount: 60,
        priority: 'high',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Grand prize',
        category: 'prizes',
        estimatedAmount: 10000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Category prizes',
        category: 'prizes',
        estimatedAmount: 5000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Sponsor prizes',
        category: 'prizes',
        estimatedAmount: 3000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'Mentor travel',
        category: 'speakers',
        estimatedAmount: 3000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'T-shirts',
        category: 'supplies',
        estimatedAmount: 12,
        priority: 'medium',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Stickers & swag',
        category: 'supplies',
        estimatedAmount: 8,
        priority: 'low',
        isVariable: true,
        variableUnit: 'participant'
      },
      {
        name: 'Hardware/API credits',
        category: 'equipment',
        estimatedAmount: 2000,
        priority: 'medium',
        isVariable: false
      },
      {
        name: 'A/V for demos',
        category: 'equipment',
        estimatedAmount: 3000,
        priority: 'high',
        isVariable: false
      },
      {
        name: 'Security (overnight)',
        category: 'admin',
        estimatedAmount: 1500,
        priority: 'medium',
        isVariable: false
      }
    ]
  }
]
