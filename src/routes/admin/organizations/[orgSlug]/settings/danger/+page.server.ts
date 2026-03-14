import { canAccessSettings } from '$lib/server/permissions'
import { fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  deleteOrganization: async ({ locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to delete organizations' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Check if organization has events
      const events = await locals.pb.collection('events').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      if (events.length > 0) {
        return fail(400, {
          error: `Cannot delete organization with ${events.length} event(s). Delete events first.`
        })
      }

      // Delete all members first
      const members = await locals.pb.collection('organization_members').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      for (const member of members) {
        await locals.pb.collection('organization_members').delete(member.id)
      }

      await locals.pb.collection('organizations').delete(organization.id)
      throw redirect(303, '/admin/organizations')
    } catch (e) {
      if (isRedirect(e)) throw e
      console.error('Failed to delete organization:', e)
      return fail(500, { error: 'Failed to delete organization' })
    }
  }
}
