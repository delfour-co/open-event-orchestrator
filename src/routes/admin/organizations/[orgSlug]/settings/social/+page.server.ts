import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  updateSocial: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify organization settings' })
    }

    const formData = await request.formData()
    const twitter = formData.get('twitter') as string
    const linkedin = formData.get('linkedin') as string
    const github = formData.get('github') as string
    const youtube = formData.get('youtube') as string
    const timezone = formData.get('timezone') as string
    const defaultLocale = formData.get('defaultLocale') as string

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      await locals.pb.collection('organizations').update(organization.id, {
        twitter: twitter || null,
        linkedin: linkedin || null,
        github: github || null,
        youtube: youtube || null,
        timezone: timezone || null,
        defaultLocale: defaultLocale || null
      })

      return { success: true, message: 'Social links and localization updated successfully' }
    } catch (e) {
      console.error('Failed to update social settings:', e)
      return fail(500, { error: 'Failed to update social settings' })
    }
  }
}
