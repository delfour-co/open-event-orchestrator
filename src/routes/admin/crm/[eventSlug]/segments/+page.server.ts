import { createEvaluateSegmentUseCase } from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  const events = await locals.pb.collection('events').getList(1, 1, {
    filter: `slug = "${params.eventSlug}"`
  })
  if (events.items.length === 0) throw error(404, 'Event not found')
  const eventId = events.items[0].id as string

  const segments = await locals.pb.collection('segments').getFullList({
    filter: `eventId = "${eventId}"`,
    sort: '-created'
  })

  return {
    eventSlug: params.eventSlug,
    eventId,
    segments: segments.map((s) => {
      const criteria = s.criteria as { match?: string; rules?: unknown[] } | undefined
      return {
        id: s.id as string,
        name: s.name as string,
        description: (s.description as string) || '',
        isStatic: s.isStatic as boolean,
        contactCount: (s.contactCount as number) || 0,
        ruleCount: criteria?.rules?.length || 0,
        criteria: criteria || { match: 'all', rules: [] },
        createdAt: new Date(s.created as string)
      }
    })
  }
}

export const actions: Actions = {
  createSegment: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const criteriaJson = formData.get('criteria') as string
    const isStatic = formData.get('isStatic') === 'on'

    if (!name) {
      return fail(400, { error: 'Name is required', action: 'createSegment' })
    }

    const events = await locals.pb.collection('events').getList(1, 1, {
      filter: `slug = "${params.eventSlug}"`
    })
    if (events.items.length === 0) {
      return fail(404, { error: 'Event not found', action: 'createSegment' })
    }
    const eventId = events.items[0].id as string

    let criteria = { match: 'all' as const, rules: [] as unknown[] }
    if (criteriaJson) {
      try {
        criteria = JSON.parse(criteriaJson)
      } catch {
        return fail(400, { error: 'Invalid criteria JSON', action: 'createSegment' })
      }
    }

    try {
      const segment = await locals.pb.collection('segments').create({
        eventId,
        name,
        description: description || '',
        criteria: JSON.stringify(criteria),
        isStatic,
        contactCount: 0
      })

      // Evaluate segment to get initial contact count
      const evaluate = createEvaluateSegmentUseCase(locals.pb)
      const contactIds = await evaluate({
        id: segment.id as string,
        eventId,
        name,
        description: description || undefined,
        criteria: {
          match: (criteria.match as 'all' | 'any') || 'all',
          rules: criteria.rules as []
        },
        isStatic,
        contactCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await locals.pb.collection('segments').update(segment.id, {
        contactCount: contactIds.length
      })

      return { success: true, action: 'createSegment' }
    } catch (err) {
      console.error('Failed to create segment:', err)
      return fail(500, { error: 'Failed to create segment', action: 'createSegment' })
    }
  },

  updateSegment: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const criteriaJson = formData.get('criteria') as string
    const isStatic = formData.get('isStatic') === 'on'

    if (!id) {
      return fail(400, { error: 'Segment ID is required', action: 'updateSegment' })
    }
    if (!name) {
      return fail(400, { error: 'Name is required', action: 'updateSegment' })
    }

    let criteria = { match: 'all' as const, rules: [] as unknown[] }
    if (criteriaJson) {
      try {
        criteria = JSON.parse(criteriaJson)
      } catch {
        return fail(400, { error: 'Invalid criteria JSON', action: 'updateSegment' })
      }
    }

    try {
      const segment = await locals.pb.collection('segments').getOne(id)

      await locals.pb.collection('segments').update(id, {
        name,
        description: description || '',
        criteria: JSON.stringify(criteria),
        isStatic
      })

      // Re-evaluate contact count
      const evaluate = createEvaluateSegmentUseCase(locals.pb)
      const contactIds = await evaluate({
        id,
        eventId: segment.eventId as string,
        name,
        description: description || undefined,
        criteria: {
          match: (criteria.match as 'all' | 'any') || 'all',
          rules: criteria.rules as []
        },
        isStatic,
        contactCount: 0,
        createdAt: new Date(segment.created as string),
        updatedAt: new Date()
      })

      await locals.pb.collection('segments').update(id, {
        contactCount: contactIds.length
      })

      return { success: true, action: 'updateSegment' }
    } catch (err) {
      console.error('Failed to update segment:', err)
      return fail(500, { error: 'Failed to update segment', action: 'updateSegment' })
    }
  },

  deleteSegment: async ({ request, locals }) => {
    const formData = await request.formData()
    const segmentId = formData.get('segmentId') as string

    if (!segmentId) {
      return fail(400, { error: 'Segment ID is required', action: 'deleteSegment' })
    }

    try {
      await locals.pb.collection('segments').delete(segmentId)
      return { success: true, action: 'deleteSegment' }
    } catch (err) {
      console.error('Failed to delete segment:', err)
      return fail(500, { error: 'Failed to delete segment', action: 'deleteSegment' })
    }
  },

  refreshCount: async ({ request, locals }) => {
    const formData = await request.formData()
    const segmentId = formData.get('segmentId') as string

    if (!segmentId) {
      return fail(400, { error: 'Segment ID is required', action: 'refreshCount' })
    }

    try {
      const segment = await locals.pb.collection('segments').getOne(segmentId)
      const criteria = segment.criteria as { match?: string; rules?: unknown[] } | undefined

      const evaluate = createEvaluateSegmentUseCase(locals.pb)
      const contactIds = await evaluate({
        id: segment.id as string,
        eventId: segment.eventId as string,
        name: segment.name as string,
        description: (segment.description as string) || undefined,
        criteria: {
          match: ((criteria?.match as string) || 'all') as 'all' | 'any',
          rules: (criteria?.rules as []) || []
        },
        isStatic: segment.isStatic as boolean,
        contactCount: (segment.contactCount as number) || 0,
        createdAt: new Date(segment.created as string),
        updatedAt: new Date(segment.updated as string)
      })

      await locals.pb.collection('segments').update(segmentId, {
        contactCount: contactIds.length
      })

      return { success: true, action: 'refreshCount' }
    } catch (err) {
      console.error('Failed to refresh segment count:', err)
      return fail(500, { error: 'Failed to refresh segment count', action: 'refreshCount' })
    }
  },

  previewCount: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const criteriaJson = formData.get('criteria') as string

    const events = await locals.pb.collection('events').getList(1, 1, {
      filter: `slug = "${params.eventSlug}"`
    })
    if (events.items.length === 0) {
      return fail(404, { error: 'Event not found', action: 'previewCount' })
    }
    const eventId = events.items[0].id as string

    let criteria = { match: 'all' as const, rules: [] as unknown[] }
    if (criteriaJson) {
      try {
        criteria = JSON.parse(criteriaJson)
      } catch {
        return fail(400, { error: 'Invalid criteria JSON', action: 'previewCount' })
      }
    }

    if (!criteria.rules || criteria.rules.length === 0) {
      return { success: true, action: 'previewCount', count: 0 }
    }

    try {
      const evaluate = createEvaluateSegmentUseCase(locals.pb)
      const contactIds = await evaluate({
        id: 'preview',
        eventId,
        name: 'Preview',
        criteria: {
          match: (criteria.match as 'all' | 'any') || 'all',
          rules: criteria.rules as []
        },
        isStatic: false,
        contactCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return { success: true, action: 'previewCount', count: contactIds.length }
    } catch (err) {
      console.error('Failed to preview segment count:', err)
      return fail(500, { error: 'Failed to calculate preview', action: 'previewCount' })
    }
  }
}
