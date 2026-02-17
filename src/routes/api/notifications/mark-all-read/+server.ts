import { createNotificationRepository } from '$lib/features/notifications'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const repository = createNotificationRepository(locals.pb)
    const count = await repository.markAllAsRead(locals.user.id)
    return json({ success: true, count })
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err)
    return json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
