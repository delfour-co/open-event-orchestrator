import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  const events = await locals.pb.collection('events').getFullList({
    filter: `organizationId = "${organizationId}"`,
    sort: '-created'
  })

  return {
    events: events.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      createdAt: new Date(e.created as string)
    }))
  }
}
