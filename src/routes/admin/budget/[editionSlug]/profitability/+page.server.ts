import { createProfitabilityService } from '$lib/features/budget/services'
import { createForecastService } from '$lib/features/budget/services'
import { createSuggestionService } from '$lib/features/budget/services'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Get profitability metrics
  const profitabilityService = createProfitabilityService(locals.pb)
  const metrics = await profitabilityService.calculateProfitability(editionId)

  // Get forecast
  const forecastService = createForecastService(locals.pb)
  const forecast = await forecastService.getForecast(editionId)

  // Get suggestions
  const suggestionService = createSuggestionService(locals.pb)
  const suggestions = await suggestionService.getSuggestions(editionId, 5)

  // Get budget currency
  let currency = 'EUR'
  try {
    const budget = await locals.pb
      .collection('edition_budgets')
      .getFirstListItem(`editionId = "${editionId}"`)
    currency = (budget.currency as string) || 'EUR'
  } catch {
    // No budget, use default
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    currency,
    metrics,
    forecast: {
      ...forecast,
      eventDate: forecast.eventDate?.toISOString() || null
    },
    suggestions
  }
}
