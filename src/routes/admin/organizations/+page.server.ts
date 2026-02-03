import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const organizations = await locals.pb.collection('organizations').getFullList({
    sort: 'name'
  })

  // Get events count per organization
  const events = await locals.pb.collection('events').getFullList()

  return {
    organizations: organizations.map((o) => ({
      id: o.id as string,
      name: o.name as string,
      slug: o.slug as string,
      description: (o.description as string) || '',
      eventsCount: events.filter((e) => e.organizationId === o.id).length,
      createdAt: new Date(o.created as string)
    }))
  }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const data = await request.formData()
    const name = data.get('name') as string
    const slug = data.get('slug') as string
    const description = data.get('description') as string

    if (!name || !slug) {
      return fail(400, { error: 'Name and slug are required' })
    }

    // Check if slug already exists
    try {
      const existing = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${slug}"`)
      if (existing) {
        return fail(400, { error: 'An organization with this slug already exists' })
      }
    } catch {
      // No existing organization with this slug, continue
    }

    try {
      await locals.pb.collection('organizations').create({
        name,
        slug,
        description
      })
      return { success: true }
    } catch (e) {
      console.error('Failed to create organization:', e)
      return fail(500, { error: 'Failed to create organization' })
    }
  },

  update: async ({ request, locals }) => {
    const data = await request.formData()
    const id = data.get('id') as string
    const name = data.get('name') as string
    const slug = data.get('slug') as string
    const description = data.get('description') as string

    if (!id || !name || !slug) {
      return fail(400, { error: 'ID, name and slug are required' })
    }

    try {
      await locals.pb.collection('organizations').update(id, {
        name,
        slug,
        description
      })
      return { success: true }
    } catch (e) {
      console.error('Failed to update organization:', e)
      return fail(500, { error: 'Failed to update organization' })
    }
  },

  delete: async ({ request, locals }) => {
    const data = await request.formData()
    const id = data.get('id') as string

    if (!id) {
      return fail(400, { error: 'Organization ID is required' })
    }

    try {
      // Check if organization has events
      const events = await locals.pb
        .collection('events')
        .getFullList({ filter: `organizationId="${id}"` })

      if (events.length > 0) {
        return fail(400, {
          error: 'Cannot delete organization with existing events. Delete events first.'
        })
      }

      await locals.pb.collection('organizations').delete(id)
      return { success: true }
    } catch (e) {
      console.error('Failed to delete organization:', e)
      return fail(500, { error: 'Failed to delete organization' })
    }
  }
}
