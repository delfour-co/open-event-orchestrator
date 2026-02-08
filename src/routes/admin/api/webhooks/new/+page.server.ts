import {
  WEBHOOK_EVENTS,
  type WebhookEventType,
  generateWebhookSecret
} from '$lib/features/api/domain/webhook'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const [organizations, events, editions] = await Promise.all([
    locals.pb.collection('organizations').getFullList({ sort: 'name' }),
    locals.pb.collection('events').getFullList({ sort: 'name' }),
    locals.pb.collection('editions').getFullList({ sort: '-year' })
  ])

  return {
    webhookEvents: WEBHOOK_EVENTS,
    organizations: organizations.map((org) => ({ id: org.id as string, name: org.name as string })),
    events: events.map((event) => ({ id: event.id as string, name: event.name as string })),
    editions: editions.map((edition) => ({
      id: edition.id as string,
      name: edition.name as string,
      year: edition.year as number
    }))
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validateWebhookEvents(events: string[]): WebhookEventType[] | null {
  const valid = events.filter((e) =>
    WEBHOOK_EVENTS.includes(e as WebhookEventType)
  ) as WebhookEventType[]
  return valid.length === events.length ? valid : null
}

function buildScope(
  scopeType: string,
  organizationId: string,
  eventId: string,
  editionId: string
): { error?: string; organizationId?: string; eventId?: string; editionId?: string } {
  if (scopeType === 'organization') {
    return organizationId
      ? { organizationId }
      : { error: 'Organization is required for organization scope' }
  }
  if (scopeType === 'event') {
    return eventId ? { eventId } : { error: 'Event is required for event scope' }
  }
  if (scopeType === 'edition') {
    return editionId ? { editionId } : { error: 'Edition is required for edition scope' }
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const url = formData.get('url') as string
    const webhookEvents = formData.getAll('events') as string[]
    const retryCount = formData.get('retryCount') as string

    if (!name?.trim()) return fail(400, { error: 'Name is required' })
    if (!url?.trim()) return fail(400, { error: 'URL is required' })
    if (!isValidUrl(url)) return fail(400, { error: 'Invalid URL format' })
    if (webhookEvents.length === 0) return fail(400, { error: 'At least one event is required' })

    const validEvents = validateWebhookEvents(webhookEvents)
    if (!validEvents) return fail(400, { error: 'Invalid events selected' })

    const scope = buildScope(
      formData.get('scopeType') as string,
      formData.get('organizationId') as string,
      formData.get('eventId') as string,
      formData.get('editionId') as string
    )
    if (scope.error) return fail(400, { error: scope.error })

    try {
      const secret = generateWebhookSecret()
      await locals.pb.collection('webhooks').create({
        name: name.trim(),
        url: url.trim(),
        secret,
        organizationId: scope.organizationId || null,
        eventId: scope.eventId || null,
        editionId: scope.editionId || null,
        events: validEvents,
        isActive: true,
        headers: {},
        retryCount: Number.parseInt(retryCount, 10) || 3,
        createdBy: locals.user?.id
      })
      return { success: true, webhookSecret: secret }
    } catch (err) {
      console.error('Failed to create webhook:', err)
      return fail(500, { error: 'Failed to create webhook' })
    }
  }
}
