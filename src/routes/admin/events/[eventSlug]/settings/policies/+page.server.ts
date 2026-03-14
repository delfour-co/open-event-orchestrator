import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  updatePolicies: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const contactEmail = formData.get('contactEmail') as string
    const codeOfConductUrl = formData.get('codeOfConductUrl') as string
    const privacyPolicyUrl = formData.get('privacyPolicyUrl') as string

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, {
        contactEmail: contactEmail || null,
        codeOfConductUrl: codeOfConductUrl || null,
        privacyPolicyUrl: privacyPolicyUrl || null
      })

      return { success: true, message: 'Policies updated successfully' }
    } catch (e) {
      console.error('Failed to update policies:', e)
      return fail(500, { error: 'Failed to update policies' })
    }
  }
}
