import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const userRole = locals.user?.role as string | undefined
  let events: Array<Record<string, unknown>> = []

  // Super admin can see all events
  if (userRole === 'super_admin') {
    events = await locals.pb.collection('events').getFullList({
      sort: '-created'
    })
  } else {
    // Regular users see events from their organizations
    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) throw error(404, 'No organization found')
    const organizationId = membership.items[0].organizationId as string

    events = await locals.pb.collection('events').getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: '-created'
    })
  }

  return {
    events: events.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      createdAt: new Date(e.created as string)
    }))
  }
}
