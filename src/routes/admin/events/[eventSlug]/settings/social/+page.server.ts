import { writeAuditLog } from '$lib/server/audit-log-service'
import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  updateSocial: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const twitter = formData.get('twitter') as string
    const linkedin = formData.get('linkedin') as string
    const hashtag = formData.get('hashtag') as string
    const timezone = formData.get('timezone') as string

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, {
        twitter: twitter || null,
        linkedin: linkedin || null,
        hashtag: hashtag || null,
        timezone: timezone || null
      })

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        details: { field: 'social' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Social links updated successfully' }
    } catch (e) {
      console.error('Failed to update social links:', e)
      return fail(500, { error: 'Failed to update social links' })
    }
  }
}
