import { DEFAULT_SIMULATION_PRESETS, calculateSimulation } from '$lib/features/budget/domain'
import { createSimulationScenarioRepository } from '$lib/features/budget/infra'
import { safeFilter } from '$lib/server/safe-filter'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`,
    expand: 'eventId'
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string
  const event = edition.expand?.eventId

  // Get ticket types for this edition
  const ticketTypes = await locals.pb.collection('ticket_types').getFullList({
    filter: safeFilter`editionId = ${editionId}`,
    sort: 'price'
  })

  // Get saved scenarios
  const scenarioRepo = createSimulationScenarioRepository(locals.pb)
  const scenarios = await scenarioRepo.findByEdition(editionId)

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    currency: (event?.currency as string) || 'USD',
    ticketTypes: ticketTypes.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      price: (t.price as number) / 100, // Convert from cents to currency
      maxQuantity: t.maxQuantity as number | null,
      isActive: t.isActive as boolean
    })),
    scenarios: scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      parameters: s.parameters,
      results: s.results,
      isBaseline: s.isBaseline,
      createdAt: s.createdAt
    })),
    presets: DEFAULT_SIMULATION_PRESETS.map((p) => ({
      name: p.name,
      expectedAttendees: p.expectedAttendees,
      ticketPrice: p.ticketPrice,
      sponsorshipTarget: p.sponsorshipTarget,
      fixedCosts: p.fixedCosts,
      variableCostsPerAttendee: p.variableCostsPerAttendee
    }))
  }
}

export const actions: Actions = {
  simulate: async ({ request }) => {
    const formData = await request.formData()

    const expectedAttendees = Number(formData.get('expectedAttendees')) || 0
    const ticketPrice = Number(formData.get('ticketPrice')) || 0
    const sponsorshipTarget = Number(formData.get('sponsorshipTarget')) || 0
    const fixedCostsJson = formData.get('fixedCosts') as string
    const variableCostsJson = formData.get('variableCostsPerAttendee') as string

    let fixedCosts: Array<{ name: string; amount: number }> = []
    let variableCostsPerAttendee: Array<{ name: string; amount: number }> = []

    try {
      if (fixedCostsJson) {
        fixedCosts = JSON.parse(fixedCostsJson)
      }
      if (variableCostsJson) {
        variableCostsPerAttendee = JSON.parse(variableCostsJson)
      }
    } catch {
      return fail(400, { error: 'Invalid cost data format' })
    }

    const results = calculateSimulation({
      expectedAttendees,
      ticketPrice,
      sponsorshipTarget,
      fixedCosts,
      variableCostsPerAttendee
    })

    return { success: true, results }
  },

  saveScenario: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const editionSlug = params.editionSlug

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isBaseline = formData.get('isBaseline') === 'true'
    const parametersJson = formData.get('parameters') as string

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required' })
    }

    let parameters: Record<string, unknown>
    try {
      parameters = JSON.parse(parametersJson)
    } catch {
      return fail(400, { error: 'Invalid parameters format' })
    }

    const results = calculateSimulation(parameters)

    try {
      const scenarioRepo = createSimulationScenarioRepository(locals.pb)

      // If setting as baseline, unset any existing baseline
      if (isBaseline) {
        await scenarioRepo.setAsBaseline(editionId, '')
      }

      const scenario = await scenarioRepo.create({
        editionId,
        name: name.trim(),
        description: description?.trim() || undefined,
        parameters,
        isBaseline,
        createdBy: locals.user?.id || ''
      })

      await scenarioRepo.updateResults(scenario.id, results)

      return { success: true, savedScenarioId: scenario.id }
    } catch (err) {
      console.error('Failed to save scenario:', err)
      return fail(500, { error: 'Failed to save scenario' })
    }
  },

  deleteScenario: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Scenario ID is required' })
    }

    try {
      const scenarioRepo = createSimulationScenarioRepository(locals.pb)
      await scenarioRepo.delete(id)

      return { success: true }
    } catch (err) {
      console.error('Failed to delete scenario:', err)
      return fail(500, { error: 'Failed to delete scenario' })
    }
  },

  setBaseline: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const scenarioId = formData.get('scenarioId') as string
    const editionSlug = params.editionSlug

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    try {
      const scenarioRepo = createSimulationScenarioRepository(locals.pb)
      await scenarioRepo.setAsBaseline(editionId, scenarioId)

      return { success: true }
    } catch (err) {
      console.error('Failed to set baseline:', err)
      return fail(500, { error: 'Failed to set baseline' })
    }
  }
}
