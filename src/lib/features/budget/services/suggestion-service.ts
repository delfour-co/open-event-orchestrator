import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { ChecklistItemPriority, TemplateItem } from '../domain'
import { DEFAULT_BUDGET_TEMPLATES } from '../domain'

export interface BudgetSuggestion {
  name: string
  category: string
  estimatedAmount: number
  priority: ChecklistItemPriority
  reason: string
  confidence: 'high' | 'medium' | 'low'
  source: 'template' | 'similar_event' | 'category_analysis' | 'common'
}

export interface SuggestionService {
  getSuggestions(editionId: string, limit?: number): Promise<BudgetSuggestion[]>
  getSuggestionsFromTemplate(eventType: string): BudgetSuggestion[]
}

// Common budget items that are frequently needed
const COMMON_BUDGET_ITEMS: BudgetSuggestion[] = [
  {
    name: 'Venue rental',
    category: 'venue',
    estimatedAmount: 300000,
    priority: 'high',
    reason: 'Essential for any event',
    confidence: 'high',
    source: 'common'
  },
  {
    name: 'Catering',
    category: 'catering',
    estimatedAmount: 200000,
    priority: 'high',
    reason: 'Standard attendee service',
    confidence: 'high',
    source: 'common'
  },
  {
    name: 'Audio/Video equipment',
    category: 'equipment',
    estimatedAmount: 100000,
    priority: 'high',
    reason: 'Required for presentations',
    confidence: 'high',
    source: 'common'
  },
  {
    name: 'Marketing & promotion',
    category: 'marketing',
    estimatedAmount: 80000,
    priority: 'medium',
    reason: 'Important for attendance',
    confidence: 'medium',
    source: 'common'
  },
  {
    name: 'Name badges',
    category: 'supplies',
    estimatedAmount: 10000,
    priority: 'medium',
    reason: 'Networking essential',
    confidence: 'high',
    source: 'common'
  },
  {
    name: 'Signage',
    category: 'supplies',
    estimatedAmount: 15000,
    priority: 'low',
    reason: 'Navigation and branding',
    confidence: 'medium',
    source: 'common'
  },
  {
    name: 'Photographer',
    category: 'services',
    estimatedAmount: 50000,
    priority: 'low',
    reason: 'Event documentation',
    confidence: 'medium',
    source: 'common'
  },
  {
    name: 'Insurance',
    category: 'admin',
    estimatedAmount: 30000,
    priority: 'medium',
    reason: 'Risk management',
    confidence: 'medium',
    source: 'common'
  }
]

// Helper function to detect event type from event name
function detectEventType(eventName: string): string {
  const nameLower = eventName.toLowerCase()
  if (nameLower.includes('meetup')) return 'meetup'
  if (nameLower.includes('workshop')) return 'workshop'
  if (nameLower.includes('hackathon')) return 'hackathon'
  return 'conference'
}

// Helper function to get suggestions from a template
function getTemplateSuggestions(eventType: string): BudgetSuggestion[] {
  const template = DEFAULT_BUDGET_TEMPLATES.find((t) => t.eventType === eventType)
  if (!template) return []

  return template.items.map((item: TemplateItem) => ({
    name: item.name,
    category: item.category || 'other',
    estimatedAmount: item.estimatedAmount,
    priority: item.priority,
    reason: `Standard item for ${eventType}`,
    confidence: 'high' as const,
    source: 'template' as const
  }))
}

// Helper function to filter and add template suggestions
function addTemplateSuggestions(
  suggestions: BudgetSuggestion[],
  eventType: string,
  existingNames: Set<string>
): void {
  const templateSuggestions = getTemplateSuggestions(eventType)
  for (const suggestion of templateSuggestions) {
    if (!existingNames.has(suggestion.name.toLowerCase())) {
      suggestions.push({
        ...suggestion,
        reason: `Recommended for ${eventType} events`
      })
    }
  }
}

// Helper function to add common items not already suggested
function addCommonSuggestions(suggestions: BudgetSuggestion[], existingNames: Set<string>): void {
  for (const common of COMMON_BUDGET_ITEMS) {
    if (existingNames.has(common.name.toLowerCase())) continue
    const alreadySuggested = suggestions.some(
      (s) => s.name.toLowerCase() === common.name.toLowerCase()
    )
    if (!alreadySuggested) {
      suggestions.push(common)
    }
  }
}

// Helper function to boost confidence for missing essential categories
function boostEssentialCategories(
  suggestions: BudgetSuggestion[],
  categorySpending: Record<string, number>
): void {
  const essentialCategories = ['venue', 'catering', 'equipment']
  for (const cat of essentialCategories) {
    if (!categorySpending[cat] || categorySpending[cat] === 0) {
      const existingSuggestion = suggestions.find((s) => s.category.toLowerCase() === cat)
      if (existingSuggestion) {
        existingSuggestion.confidence = 'high'
        existingSuggestion.reason = `No ${cat} budget allocated yet`
      }
    }
  }
}

// Helper function to sort suggestions by priority and confidence
function sortSuggestions(suggestions: BudgetSuggestion[]): void {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const confidenceOrder = { high: 0, medium: 1, low: 2 }

  suggestions.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
  })
}

// Helper function to get category spending map
async function getCategorySpending(
  pb: PocketBase,
  editionId: string
): Promise<Record<string, number>> {
  const categorySpending: Record<string, number> = {}

  let budgetId: string | null = null
  try {
    const budget = await pb
      .collection('edition_budgets')
      .getFirstListItem(safeFilter`editionId = ${editionId}`)
    budgetId = budget.id as string
  } catch {
    // No budget found
  }

  if (!budgetId) return categorySpending

  const categories = await pb.collection('budget_categories').getFullList({
    filter: safeFilter`budgetId = ${budgetId}`,
    fields: 'id,name,plannedAmount'
  })

  for (const cat of categories) {
    categorySpending[(cat.name as string).toLowerCase()] = (cat.plannedAmount as number) || 0
  }

  return categorySpending
}

export function createSuggestionService(pb: PocketBase): SuggestionService {
  return {
    async getSuggestions(editionId: string, limit = 10): Promise<BudgetSuggestion[]> {
      const suggestions: BudgetSuggestion[] = []

      // Get edition info to determine event type
      const edition = await pb.collection('editions').getOne(editionId, {
        expand: 'eventId'
      })

      // Get existing checklist items to avoid duplicates
      const existingItems = await pb.collection('budget_checklist_items').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'name'
      })
      const existingNames = new Set(existingItems.map((i) => (i.name as string).toLowerCase()))

      // Get category spending analysis
      const categorySpending = await getCategorySpending(pb, editionId)

      // Detect event type
      const eventId = edition.eventId as string
      let detectedEventType = 'conference'
      if (eventId) {
        const event = await pb.collection('events').getOne(eventId)
        detectedEventType = detectEventType((event.name as string) || '')
      }

      // Add suggestions from template
      addTemplateSuggestions(suggestions, detectedEventType, existingNames)

      // Add common items not already suggested
      addCommonSuggestions(suggestions, existingNames)

      // Boost confidence for missing essential categories
      boostEssentialCategories(suggestions, categorySpending)

      // Sort by priority and confidence
      sortSuggestions(suggestions)

      return suggestions.slice(0, limit)
    },

    getSuggestionsFromTemplate(eventType: string): BudgetSuggestion[] {
      return getTemplateSuggestions(eventType)
    }
  }
}
