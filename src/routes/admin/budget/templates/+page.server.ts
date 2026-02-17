import { DEFAULT_BUDGET_TEMPLATES, getEventTypeLabel } from '$lib/features/budget/domain'
import { createBudgetTemplateRepository } from '$lib/features/budget/infra'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const templateRepo = createBudgetTemplateRepository(locals.pb)
  const templates = await templateRepo.findAll()

  return {
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      eventType: t.eventType,
      eventTypeLabel: getEventTypeLabel(t.eventType),
      isGlobal: t.isGlobal,
      itemCount: t.items.length,
      usageCount: t.usageCount,
      createdAt: t.createdAt.toISOString()
    })),
    defaultTemplates: DEFAULT_BUDGET_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      eventType: t.eventType,
      eventTypeLabel: getEventTypeLabel(t.eventType),
      itemCount: t.items.length
    }))
  }
}

export const actions: Actions = {
  createTemplate: async ({ request, locals }) => {
    const formData = await request.formData()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const eventType = formData.get('eventType') as string
    const isGlobal = formData.get('isGlobal') === 'true'
    const itemsJson = formData.get('items') as string

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required' })
    }

    if (!eventType) {
      return fail(400, { error: 'Event type is required' })
    }

    let items = []
    try {
      if (itemsJson) {
        items = JSON.parse(itemsJson)
      }
    } catch {
      return fail(400, { error: 'Invalid items format' })
    }

    try {
      const templateRepo = createBudgetTemplateRepository(locals.pb)

      await templateRepo.create({
        name: name.trim(),
        description: description?.trim() || undefined,
        eventType: eventType as 'conference' | 'meetup' | 'workshop' | 'hackathon' | 'other',
        isGlobal,
        items,
        createdBy: locals.user?.id || ''
      })

      return { success: true }
    } catch (err) {
      console.error('Failed to create template:', err)
      return fail(500, { error: 'Failed to create template' })
    }
  },

  deleteTemplate: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Template ID is required' })
    }

    try {
      const templateRepo = createBudgetTemplateRepository(locals.pb)
      await templateRepo.delete(id)

      return { success: true }
    } catch (err) {
      console.error('Failed to delete template:', err)
      return fail(500, { error: 'Failed to delete template' })
    }
  },

  seedDefaults: async ({ locals }) => {
    try {
      const templateRepo = createBudgetTemplateRepository(locals.pb)

      for (const template of DEFAULT_BUDGET_TEMPLATES) {
        await templateRepo.create({
          name: template.name,
          description: template.description,
          eventType: template.eventType,
          isGlobal: true,
          items: template.items,
          createdBy: locals.user?.id || ''
        })
      }

      return {
        success: true,
        message: `Created ${DEFAULT_BUDGET_TEMPLATES.length} default templates`
      }
    } catch (err) {
      console.error('Failed to seed templates:', err)
      return fail(500, { error: 'Failed to seed templates' })
    }
  }
}
