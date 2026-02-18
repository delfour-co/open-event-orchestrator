import type PocketBase from 'pocketbase'
import { describe, expect, it, vi } from 'vitest'
import { createSuggestionService } from './suggestion-service'

// Helper to create mock PocketBase with common structure
function createMockPb(options: {
  eventName?: string
  existingItems?: Array<{ name: string }>
}): PocketBase {
  const { eventName = 'Conference', existingItems = [] } = options

  return {
    collection: vi.fn().mockImplementation((name) => {
      const handlers: Record<string, unknown> = {
        editions: {
          getOne: vi.fn().mockResolvedValue({ id: 'edition-1', eventId: 'event-1' })
        },
        events: {
          getOne: vi.fn().mockResolvedValue({ id: 'event-1', name: eventName })
        },
        budget_checklist_items: {
          getFullList: vi.fn().mockResolvedValue(existingItems)
        },
        edition_budgets: {
          getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
        }
      }
      return handlers[name] || { getFullList: vi.fn().mockResolvedValue([]) }
    })
  } as unknown as PocketBase
}

describe('SuggestionService', () => {
  describe('getSuggestionsFromTemplate', () => {
    const mockPb = {} as PocketBase
    const service = createSuggestionService(mockPb)

    it('should return suggestions for conference template', () => {
      const suggestions = service.getSuggestionsFromTemplate('conference')

      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toHaveProperty('name')
      expect(suggestions[0]).toHaveProperty('category')
      expect(suggestions[0]).toHaveProperty('estimatedAmount')
      expect(suggestions[0]).toHaveProperty('priority')
      expect(suggestions[0]).toHaveProperty('reason')
      expect(suggestions[0]).toHaveProperty('confidence')
      expect(suggestions[0]).toHaveProperty('source')
      expect(suggestions[0].source).toBe('template')
      expect(suggestions[0].confidence).toBe('high')
    })

    it('should return suggestions for meetup template', () => {
      const suggestions = service.getSuggestionsFromTemplate('meetup')

      expect(suggestions.length).toBeGreaterThan(0)
      for (const s of suggestions) {
        expect(s.source).toBe('template')
      }
    })

    it('should return suggestions for workshop template', () => {
      const suggestions = service.getSuggestionsFromTemplate('workshop')

      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return suggestions for hackathon template', () => {
      const suggestions = service.getSuggestionsFromTemplate('hackathon')

      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown template type', () => {
      const suggestions = service.getSuggestionsFromTemplate('unknown-type')

      expect(suggestions).toEqual([])
    })

    it('should have valid priority values', () => {
      const suggestions = service.getSuggestionsFromTemplate('conference')

      for (const s of suggestions) {
        expect(['low', 'medium', 'high']).toContain(s.priority)
      }
    })

    it('should have numeric estimated amounts', () => {
      const suggestions = service.getSuggestionsFromTemplate('conference')

      for (const s of suggestions) {
        expect(typeof s.estimatedAmount).toBe('number')
        expect(s.estimatedAmount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('getSuggestions', () => {
    it('should return suggestions for an edition', async () => {
      const mockPb = createMockPb({ eventName: 'Tech Conference 2024' })
      const service = createSuggestionService(mockPb)
      const suggestions = await service.getSuggestions('edition-1')

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeLessThanOrEqual(10) // default limit
    })

    it('should respect limit parameter', async () => {
      const mockPb = createMockPb({ eventName: 'Workshop Event' })
      const service = createSuggestionService(mockPb)
      const suggestions = await service.getSuggestions('edition-1', 3)

      expect(suggestions.length).toBeLessThanOrEqual(3)
    })

    it('should not suggest items that already exist', async () => {
      const mockPb = createMockPb({
        eventName: 'Conference',
        existingItems: [{ name: 'Venue rental' }, { name: 'Catering' }]
      })
      const service = createSuggestionService(mockPb)
      const suggestions = await service.getSuggestions('edition-1')

      // Should not include 'Venue rental' or 'Catering'
      const venueItem = suggestions.find((s) => s.name.toLowerCase() === 'venue rental')
      const cateringItem = suggestions.find((s) => s.name.toLowerCase() === 'catering')

      expect(venueItem).toBeUndefined()
      expect(cateringItem).toBeUndefined()
    })

    it('should sort suggestions by priority and confidence', async () => {
      const mockPb = createMockPb({ eventName: 'Meetup' })
      const service = createSuggestionService(mockPb)
      const suggestions = await service.getSuggestions('edition-1', 20)

      // Check that high priority items come first
      const priorities = suggestions.map((s) => s.priority)
      const priorityOrder = { high: 0, medium: 1, low: 2 }

      for (let i = 1; i < priorities.length; i++) {
        const currentPriority = priorityOrder[priorities[i] as keyof typeof priorityOrder]
        const previousPriority = priorityOrder[priorities[i - 1] as keyof typeof priorityOrder]
        expect(currentPriority).toBeGreaterThanOrEqual(previousPriority)
      }
    })
  })
})
