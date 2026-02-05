import { createEvaluateSegmentUseCase } from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  const segments = await locals.pb.collection('segments').getFullList({
    filter: `organizationId = "${organizationId}"`,
    sort: '-created'
  })

  return {
    organizationId,
    segments: segments.map((s) => {
      const criteria = s.criteria as { match?: string; rules?: unknown[] } | undefined
      return {
        id: s.id as string,
        name: s.name as string,
        description: (s.description as string) || '',
        isStatic: s.isStatic as boolean,
        contactCount: (s.contactCount as number) || 0,
        ruleCount: criteria?.rules?.length || 0,
        createdAt: new Date(s.created as string)
      }
    })
  }
}

export const actions: Actions = {
  createSegment: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim()
    const criteriaJson = formData.get('criteria') as string
    const isStatic = formData.get('isStatic') === 'on'

    if (!name) {
      return fail(400, { error: 'Name is required', action: 'createSegment' })
    }

    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found', action: 'createSegment' })
    }
    const organizationId = membership.items[0].organizationId as string

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
        organizationId,
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
        organizationId,
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
        organizationId: segment.organizationId as string,
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
  }
}
